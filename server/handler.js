const crypto = require('node:crypto');
const { readSnapshot, update, passwordHash } = require('./store');

const SESSION_SECRET = process.env.HRFLOW_SESSION_SECRET || 'local-demo-only-change-before-deploy';
const HOUR = 60 * 60 * 1000;

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const fail = (status, message, details) => { throw new HttpError(status, message, details); };
const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const publicEmployee = ({ salt, passwordHash: hash, ...employee }) => employee;
const publicUser = (user, employee) => ({
  id: user.id, employeeId: user.employeeId, email: user.email, username: user.username,
  role: user.role, status: user.status, firstName: employee.firstName, lastName: employee.lastName,
  department: employee.department, position: employee.position,
});
const employeeById = (data, id) => data.employees.find((employee) => employee.id === id);
const leaveTypeById = (data, id) => data.leaveTypes.find((type) => type.id === id && type.status === 'ACTIVE');
const shiftById = (data, id) => data.shifts.find((shift) => shift.id === id && shift.status === 'ACTIVE');
const isDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const inclusiveDays = (start, end) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
const overlapsDates = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd;
const safeEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

function newNotification(data, userId, type, title, message) {
  data.notifications.unshift({ id: makeId('notif'), userId, type, title, message, isRead: false, createdAt: new Date().toISOString() });
}

function makeToken(userId, sessionVersion = 0) {
  const expiresAt = Date.now() + 7 * 24 * HOUR;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt, sessionVersion })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function requestUser(req, data) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = verifyToken(token);
  const user = data.users.find((entry) => entry.id === session?.userId && entry.status === 'ACTIVE' && (entry.sessionVersion || 0) === session.sessionVersion);
  if (!user) fail(401, 'Your session has expired. Sign in again.');
  const employee = employeeById(data, user.employeeId);
  if (!employee || employee.status !== 'ACTIVE') fail(401, 'This account is inactive. Contact your HR administrator.');
  return { user, employee };
}

function requireAdmin(user) {
  if (user.role !== 'ADMIN') fail(403, 'You do not have permission to do that.');
}

function requestData(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function scheduleBounds(schedule, shift) {
  const start = Date.parse(`${schedule.workDate}T${shift.startTime}:00`);
  let end = Date.parse(`${schedule.workDate}T${shift.endTime}:00`);
  if (end <= start) end += 86400000;
  return { start, end };
}

function conflictingSchedule(data, candidate, excludedId) {
  const candidateShift = shiftById(data, candidate.shiftId);
  const candidateBounds = scheduleBounds(candidate, candidateShift);
  return data.schedules.find((item) => {
    if (item.employeeId !== candidate.employeeId || item.status !== 'ACTIVE' || item.id === excludedId) return false;
    const otherShift = shiftById(data, item.shiftId) || data.shifts.find((entry) => entry.id === item.shiftId);
    if (!otherShift) return false;
    const otherBounds = scheduleBounds(item, otherShift);
    return candidateBounds.start < otherBounds.end && otherBounds.start < candidateBounds.end;
  });
}

function describeScheduleConflict(data, conflict) {
  const employee = employeeById(data, conflict.employeeId);
  const shift = data.shifts.find((entry) => entry.id === conflict.shiftId);
  return `This overlaps with ${employee.firstName} ${employee.lastName}'s ${shift.name} shift on ${conflict.workDate}.`;
}

function requireText(value, label, max = 120) {
  if (typeof value !== 'string' || !value.trim()) fail(400, `${label} is required.`);
  if (value.trim().length > max) fail(400, `${label} must be ${max} characters or fewer.`);
  return value.trim();
}

function dataForEmployee(data, employee, user) {
  const isAdmin = user.role === 'ADMIN';
  const employeeIds = isAdmin ? new Set(data.employees.map((entry) => entry.id)) : new Set([employee.id]);
  const schedules = data.schedules.filter((item) => employeeIds.has(item.employeeId));
  const requestRows = data.leaveRequests.filter((item) => employeeIds.has(item.employeeId));
  return {
    user: publicUser(user, employee),
    employee: publicEmployee(employee),
    employees: isAdmin ? data.employees.map(publicEmployee) : [],
    departments: isAdmin ? data.departments : [],
    positions: isAdmin ? data.positions : [],
    leaveTypes: data.leaveTypes,
    shifts: data.shifts,
    schedules,
    leaveRequests: requestRows,
    notifications: data.notifications.filter((item) => item.userId === user.id),
  };
}

function authenticate(data, body) {
  const identity = String(body.email || body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = data.users.find((entry) => entry.email.toLowerCase() === identity || entry.username.toLowerCase() === identity);
  if (!user || user.status !== 'ACTIVE' || !safeEqual(passwordHash(password, user.salt), user.passwordHash)) fail(401, 'The email or password is incorrect.');
  const employee = employeeById(data, user.employeeId);
  return { token: makeToken(user.id, user.sessionVersion || 0), user: publicUser(user, employee) };
}

function handleRequest(method, pathname, req, data) {
  if (pathname === '/api/auth/login' && method === 'POST') return authenticate(data, requestData(req));

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const { user } = requestUser(req, data);
    return update((state) => {
      const current = state.users.find((entry) => entry.id === user.id);
      current.sessionVersion = (current.sessionVersion || 0) + 1;
      return { ok: true };
    });
  }

  const { user, employee } = requestUser(req, data);

  if (pathname === '/api/session' && method === 'GET') return dataForEmployee(data, employee, user);

  if (pathname === '/api/notifications/read-all' && method === 'POST') {
    return update((state) => {
      state.notifications.filter((item) => item.userId === user.id).forEach((item) => { item.isRead = true; });
      return { ok: true };
    });
  }
  const notificationRead = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (notificationRead && method === 'POST') {
    return update((state) => {
      const notification = state.notifications.find((item) => item.id === notificationRead[1] && item.userId === user.id);
      if (notification) notification.isRead = true;
      return { ok: true };
    });
  }

  if (pathname === '/api/leave-requests' && method === 'POST') {
    const input = requestData(req);
    const leaveTypeId = requireText(input.leaveTypeId, 'Leave type', 80);
    const startDate = input.startDate;
    const endDate = input.endDate;
    const reason = requireText(input.reason, 'Reason', 500);
    if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) fail(400, 'Choose a valid date range. The end date must be on or after the start date.');
    const leaveType = leaveTypeById(data, leaveTypeId);
    if (!leaveType) fail(400, 'Choose an active leave type.');
    const days = inclusiveDays(startDate, endDate);
    const overlap = data.leaveRequests.some((request) => request.employeeId === employee.id && ['PENDING', 'APPROVED'].includes(request.status) && overlapsDates(startDate, endDate, request.startDate, request.endDate));
    if (overlap) fail(409, 'These dates overlap with a pending or approved leave request.');
    const reserved = data.leaveRequests.filter((request) => request.employeeId === employee.id && request.leaveTypeId === leaveTypeId && request.status === 'PENDING').reduce((sum, request) => sum + request.days, 0);
    if (employee[leaveType.balanceField] - reserved < days) fail(400, `You have ${Math.max(0, employee[leaveType.balanceField] - reserved)} ${leaveType.name.toLowerCase()} days available.`);
    const created = update((state) => {
      const request = { id: makeId('leave'), employeeId: employee.id, leaveTypeId, startDate, endDate, days, reason, status: 'PENDING', submittedAt: new Date().toISOString() };
      state.leaveRequests.unshift(request);
      state.users.filter((entry) => entry.role === 'ADMIN' && entry.status === 'ACTIVE').forEach((admin) => newNotification(state, admin.id, 'leave', 'Leave request needs review', `${employee.firstName} ${employee.lastName} requested ${leaveType.name.toLowerCase()}.`));
      return request;
    });
    return { leaveRequest: created };
  }

  const review = pathname.match(/^\/api\/leave-requests\/([^/]+)\/(approve|reject)$/);
  if (review && method === 'POST') {
    requireAdmin(user);
    const [, id, decision] = review;
    const body = requestData(req);
    const result = update((state) => {
      const request = state.leaveRequests.find((item) => item.id === id);
      if (!request) fail(404, 'Leave request not found.');
      if (request.status !== 'PENDING') fail(409, 'This request has already been processed.');
      const target = employeeById(state, request.employeeId);
      const type = state.leaveTypes.find((entry) => entry.id === request.leaveTypeId);
      if (decision === 'approve') {
        if (target[type.balanceField] < request.days) fail(409, 'The employee no longer has enough leave balance to approve this request.');
        target[type.balanceField] -= request.days;
        request.status = 'APPROVED';
      } else {
        request.rejectionReason = requireText(body.reason, 'Rejection reason', 500);
        request.status = 'REJECTED';
      }
      request.reviewedAt = new Date().toISOString();
      request.reviewedBy = user.id;
      const label = decision === 'approve' ? 'approved' : 'declined';
      const detail = decision === 'approve' ? `${type.name} request approved.` : `${type.name} request declined: ${request.rejectionReason}`;
      const targetUser = state.users.find((entry) => entry.employeeId === target.id);
      newNotification(state, targetUser.id, 'leave', `Leave request ${label}`, detail);
      return request;
    });
    return { leaveRequest: result };
  }

  if (pathname === '/api/schedules' && method === 'POST') {
    requireAdmin(user);
    const body = requestData(req);
    const employeeId = requireText(body.employeeId, 'Employee', 80);
    const shiftId = requireText(body.shiftId, 'Shift', 80);
    const workDate = body.workDate;
    if (!isDate(workDate)) fail(400, 'Choose a valid work date.');
    const target = employeeById(data, employeeId);
    const shift = shiftById(data, shiftId);
    if (!target || target.status !== 'ACTIVE') fail(400, 'Choose an active employee.');
    if (!shift) fail(400, 'Choose an active shift.');
    const onLeave = data.leaveRequests.some((request) => request.employeeId === employeeId && request.status === 'APPROVED' && workDate >= request.startDate && workDate <= request.endDate);
    if (onLeave) fail(409, 'This employee has approved leave on that date.');
    const candidate = { employeeId, shiftId, workDate, status: 'ACTIVE' };
    const conflict = conflictingSchedule(data, candidate);
    if (conflict) fail(409, describeScheduleConflict(data, conflict));
    const result = update((state) => {
      const schedule = { ...candidate, id: makeId('schedule'), createdAt: new Date().toISOString() };
      state.schedules.push(schedule);
      const targetUser = state.users.find((entry) => entry.employeeId === employeeId);
      newNotification(state, targetUser.id, 'schedule', 'A shift has been assigned', `You are scheduled for ${shift.name} on ${workDate}, ${shift.startTime}–${shift.endTime}.`);
      return schedule;
    });
    return { schedule: result };
  }

  const scheduleUpdate = pathname.match(/^\/api\/schedules\/([^/]+)$/);
  if (scheduleUpdate && method === 'PUT') {
    requireAdmin(user);
    const body = requestData(req);
    const existing = data.schedules.find((entry) => entry.id === scheduleUpdate[1] && entry.status === 'ACTIVE');
    if (!existing) fail(404, 'Active schedule not found.');
    const candidate = {
      ...existing,
      employeeId: requireText(body.employeeId, 'Employee', 80),
      shiftId: requireText(body.shiftId, 'Shift', 80),
      workDate: body.workDate,
    };
    if (!isDate(candidate.workDate)) fail(400, 'Choose a valid work date.');
    const target = employeeById(data, candidate.employeeId);
    const shift = shiftById(data, candidate.shiftId);
    if (!target || target.status !== 'ACTIVE') fail(400, 'Choose an active employee.');
    if (!shift) fail(400, 'Choose an active shift.');
    const onLeave = data.leaveRequests.some((request) => request.employeeId === candidate.employeeId && request.status === 'APPROVED' && candidate.workDate >= request.startDate && candidate.workDate <= request.endDate);
    if (onLeave) fail(409, 'This employee has approved leave on that date.');
    const conflict = conflictingSchedule(data, candidate, existing.id);
    if (conflict) fail(409, describeScheduleConflict(data, conflict));
    const result = update((state) => {
      const current = state.schedules.find((entry) => entry.id === existing.id);
      const changed = current.employeeId !== candidate.employeeId || current.workDate !== candidate.workDate || current.shiftId !== candidate.shiftId;
      Object.assign(current, candidate, { updatedAt: new Date().toISOString() });
      if (changed) {
        const targetUser = state.users.find((entry) => entry.employeeId === target.id);
        newNotification(state, targetUser.id, 'schedule', 'Your schedule changed', `You are scheduled for ${shift.name} on ${candidate.workDate}, ${shift.startTime}–${shift.endTime}.`);
      }
      return current;
    });
    return { schedule: result };
  }

  const scheduleRoute = pathname.match(/^\/api\/schedules\/([^/]+)$/);
  if (scheduleRoute && method === 'DELETE') {
    requireAdmin(user);
    return update((state) => {
      const schedule = state.schedules.find((entry) => entry.id === scheduleRoute[1] && entry.status === 'ACTIVE');
      if (!schedule) fail(404, 'Schedule not found.');
      schedule.status = 'CANCELLED';
      const target = employeeById(state, schedule.employeeId);
      const targetUser = state.users.find((entry) => entry.employeeId === target.id);
      newNotification(state, targetUser.id, 'schedule', 'A shift was removed', `Your shift on ${schedule.workDate} was removed.`);
      return { ok: true };
    });
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) fail(404, 'That route was not found.');
  requireAdmin(user);

  if (pathname === '/api/admin/overview' && method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const activeEmployees = data.employees.filter((entry) => entry.status === 'ACTIVE');
    return {
      employeeCount: activeEmployees.length,
      pendingLeaveCount: data.leaveRequests.filter((request) => request.status === 'PENDING').length,
      onLeaveCount: new Set(data.leaveRequests.filter((request) => request.status === 'APPROVED' && today >= request.startDate && today <= request.endDate).map((request) => request.employeeId)).size,
      upcomingShiftCount: data.schedules.filter((schedule) => schedule.status === 'ACTIVE' && schedule.workDate >= today).length,
    };
  }

  if (pathname === '/api/employees' && method === 'POST') {
    const body = requestData(req);
    const firstName = requireText(body.firstName, 'First name', 80);
    const lastName = requireText(body.lastName, 'Last name', 80);
    const email = requireText(body.email, 'Email', 180).toLowerCase();
    const employeeNumber = requireText(body.employeeNumber, 'Employee ID', 40);
    const department = requireText(body.department, 'Department', 100);
    const position = requireText(body.position, 'Position', 100);
    if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Enter a valid email address.');
    if (data.employees.some((item) => item.id === employeeNumber || item.email.toLowerCase() === email)) fail(409, 'That employee ID or email is already in use.');
    if (!data.departments.some((item) => item.name === department && item.status === 'ACTIVE')) fail(400, 'Choose an active department.');
    if (!data.positions.some((item) => item.name === position && item.status === 'ACTIVE')) fail(400, 'Choose an active position.');
    const username = requireText(body.username || email.split('@')[0], 'Username', 80).toLowerCase();
    if (data.users.some((item) => item.username.toLowerCase() === username || item.email.toLowerCase() === email)) fail(409, 'That username or email already has an account.');
    const password = requireText(body.password || 'Welcome123!', 'Password', 128);
    if (password.length < 8) fail(400, 'Password must have at least 8 characters.');
    const result = update((state) => {
      const id = employeeNumber;
      const salt = crypto.randomBytes(16).toString('hex');
      const created = { id, username, firstName, lastName, email, phone: String(body.phone || '').slice(0, 40), department, position, role: 'EMPLOYEE', status: 'ACTIVE', hireDate: isDate(body.hireDate) ? body.hireDate : new Date().toISOString().slice(0, 10), annualBalance: Number.isFinite(Number(body.annualBalance)) ? Math.max(0, Number(body.annualBalance)) : 12, sickBalance: 8, personalBalance: 3, salt, passwordHash: passwordHash(password, salt), createdAt: new Date().toISOString() };
      state.employees.push(created);
      state.users.push({ id: `user-${id}`, employeeId: id, username, email, role: 'EMPLOYEE', status: 'ACTIVE', salt, passwordHash: created.passwordHash, sessionVersion: 0 });
      return publicEmployee(created);
    });
    return { employee: result };
  }

  const employeeRoute = pathname.match(/^\/api\/employees\/([^/]+)$/);
  if (employeeRoute && method === 'PUT') {
    const body = requestData(req);
    const result = update((state) => {
      const target = employeeById(state, employeeRoute[1]);
      if (!target) fail(404, 'Employee not found.');
      for (const field of ['firstName', 'lastName', 'email', 'department', 'position']) {
        if (body[field] !== undefined) target[field] = requireText(body[field], field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`), field === 'email' ? 180 : 120);
      }
      if (body.phone !== undefined) target.phone = String(body.phone).slice(0, 40);
      if (body.hireDate !== undefined) {
        if (!isDate(body.hireDate)) fail(400, 'Choose a valid hire date.');
        target.hireDate = body.hireDate;
      }
      target.email = target.email.toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(target.email)) fail(400, 'Enter a valid email address.');
      if (state.employees.some((entry) => entry.id !== target.id && entry.email.toLowerCase() === target.email)) fail(409, 'That email is already in use.');
      if (body.annualBalance !== undefined) target.annualBalance = Math.max(0, Number(body.annualBalance) || 0);
      const account = state.users.find((entry) => entry.employeeId === target.id);
      account.email = target.email;
      return publicEmployee(target);
    });
    return { employee: result };
  }
  const deactivateEmployee = pathname.match(/^\/api\/employees\/([^/]+)\/deactivate$/);
  if (deactivateEmployee && method === 'POST') {
    if (deactivateEmployee[1] === employee.id) fail(400, 'You cannot deactivate the signed-in admin account.');
    return update((state) => {
      const target = employeeById(state, deactivateEmployee[1]);
      if (!target || target.status !== 'ACTIVE') fail(404, 'Active employee not found.');
      target.status = 'INACTIVE';
      const account = state.users.find((entry) => entry.employeeId === target.id);
      if (account) account.status = 'INACTIVE';
      return { ok: true };
    });
  }
  const activateEmployee = pathname.match(/^\/api\/employees\/([^/]+)\/activate$/);
  if (activateEmployee && method === 'POST') {
    return update((state) => {
      const target = employeeById(state, activateEmployee[1]);
      if (!target) fail(404, 'Employee not found.');
      target.status = 'ACTIVE';
      const account = state.users.find((entry) => entry.employeeId === target.id);
      if (account) account.status = 'ACTIVE';
      return { ok: true };
    });
  }

  const collectionRoute = pathname.match(/^\/api\/(departments|positions|leave-types|shifts)(?:\/([^/]+))?$/);
  if (collectionRoute && ['POST', 'PUT', 'DELETE'].includes(method)) {
    const [, resource, id] = collectionRoute;
    const body = requestData(req);
    const plural = { departments: 'departments', positions: 'positions', 'leave-types': 'leaveTypes', shifts: 'shifts' }[resource];
    if (method === 'POST') {
      const name = requireText(body.name, 'Name', 100);
      if (data[plural].some((entry) => entry.name.toLowerCase() === name.toLowerCase() && entry.status === 'ACTIVE')) fail(409, 'That name already exists.');
      const row = { id: makeId(resource.slice(0, -1)), name, status: 'ACTIVE' };
      if (resource === 'shifts') {
        const startTime = body.startTime;
        const endTime = body.endTime;
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime || '') || startTime === endTime) fail(400, 'Set valid start and end times.');
        row.startTime = startTime;
        row.endTime = endTime;
      }
      if (resource === 'leave-types') {
        const fields = ['annualBalance', 'sickBalance', 'personalBalance'];
        const balanceField = body.balanceField;
        if (!fields.includes(balanceField)) fail(400, 'Choose the leave balance this type uses.');
        row.balanceField = balanceField;
      }
      return update((state) => { state[plural].push(row); return { [resource.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/s$/, '')]: row }; });
    }
    if (!id) fail(404, 'Record not found.');
    const existing = data[plural].find((entry) => entry.id === id);
    if (!existing) fail(404, 'Record not found.');
    if (method === 'DELETE') {
      if (resource === 'departments' && data.employees.some((entry) => entry.status === 'ACTIVE' && entry.department === existing.name)) fail(409, 'Move active employees to another department before deactivating this one.');
      if (resource === 'shifts' && data.schedules.some((entry) => entry.shiftId === id && entry.status === 'ACTIVE')) fail(409, 'Remove future schedules before deactivating this shift.');
      return update((state) => { state[plural].find((entry) => entry.id === id).status = 'INACTIVE'; return { ok: true }; });
    }
    const name = requireText(body.name, 'Name', 100);
    if (data[plural].some((entry) => entry.id !== id && entry.name.toLowerCase() === name.toLowerCase() && entry.status === 'ACTIVE')) fail(409, 'That name already exists.');
    return update((state) => {
      const row = state[plural].find((entry) => entry.id === id);
      if (resource === 'departments') state.employees.filter((entry) => entry.department === row.name).forEach((entry) => { entry.department = name; });
      if (resource === 'positions') state.employees.filter((entry) => entry.position === row.name).forEach((entry) => { entry.position = name; });
      row.name = name;
      if (resource === 'shifts') {
        const { startTime, endTime } = body;
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime || '') || startTime === endTime) fail(400, 'Set valid start and end times.');
        row.startTime = startTime;
        row.endTime = endTime;
      }
      if (resource === 'leave-types') {
        const fields = ['annualBalance', 'sickBalance', 'personalBalance'];
        if (!fields.includes(body.balanceField)) fail(400, 'Choose the leave balance this type uses.');
        row.balanceField = body.balanceField;
      }
      return { ok: true };
    });
  }

  fail(404, 'That route was not found.');
}

async function handle(req, res) {
  const method = req.method || 'GET';
  const requestUrl = new URL(req.url, 'http://localhost');
  const rewrittenPath = req.query?.__path || requestUrl.searchParams.get('__path');
  const pathname = rewrittenPath
    ? `/api/${String(Array.isArray(rewrittenPath) ? rewrittenPath.join('/') : rewrittenPath).replace(/^\/+/, '').replace(/\/$/, '')}`
    : requestUrl.pathname.replace(/\/$/, '') || '/';
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  try {
    if (process.env.VERCEL && !process.env.HRFLOW_SESSION_SECRET) fail(503, 'Set HRFLOW_SESSION_SECRET in your Vercel project settings to enable sign-in.');
    if (!req.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      if (raw) {
        try { req.body = JSON.parse(raw); } catch { throw new HttpError(400, 'Send a valid JSON request.'); }
      }
    }
    const snapshot = await readSnapshot();
    const result = handleRequest(method, pathname, req, snapshot.data);
    const resultValue = await result;
    const status = method === 'POST' ? 201 : 200;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(resultValue));
  } catch (error) {
    const status = error instanceof HttpError ? error.status : (Number(error.status) || 500);
    if (status === 500) console.error('HRFlow API error:', error);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: status === 500 ? 'Something went wrong. Please try again.' : error.message, details: error.details }));
  }
}

module.exports = { handle };
