const app = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');
const state = {
  token: sessionStorage.getItem('hrflow_token'),
  data: null,
  page: 'dashboard',
  directoryTab: 'employees',
  leaveFilter: 'ALL',
  departmentFilter: 'ALL',
  employeeStatusFilter: 'ACTIVE',
  positionFilter: 'ALL',
  scheduleSearch: '',
  scheduleShiftFilter: 'ALL',
  search: '',
  weekOffset: 0,
  modal: null,
};

const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/><path d="M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>',
  plane: '<path d="M2 16.5 22 8l-8.5 14-2.5-6-9-1.5Z"/><path d="m11 16 5.5-5.5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  sliders: '<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3"/><path d="M2 14h4m4-6h4m4 8h4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

const ico = (name, small = false) => `<svg class="icon${small ? ' icon-small' : ''}" aria-hidden="true" viewBox="0 0 24 24">${iconPaths[name] || iconPaths.info}</svg>`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const initials = (person) => `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase();
const fullName = (person) => `${person.firstName || ''} ${person.lastName || ''}`.trim();
const dateLabel = (date, options = { day: 'numeric', month: 'short' }) => date ? new Intl.DateTimeFormat('en-GB', options).format(new Date(`${date}T12:00:00`)) : '-';
const todayISO = () => new Date().toLocaleDateString('en-CA');
const formatRange = (start, end) => start === end ? dateLabel(start) : `${dateLabel(start)} – ${dateLabel(end)}`;
const titleCase = (value) => String(value || '').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
const isAdmin = () => state.data?.user?.role === 'ADMIN';
const activeCount = (list) => list.filter((item) => item.status === 'ACTIVE').length;

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
  let result = {};
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) {
    if (response.status === 401 && state.token) signOut(false);
    throw new Error(result.error || 'Your request could not be completed. Try again.');
  }
  return result;
}

function toast(message, error = false) {
  const el = document.createElement('div');
  el.className = `toast${error ? ' error' : ''}`;
  el.setAttribute('role', error ? 'alert' : 'status');
  el.textContent = message;
  toastRoot.replaceChildren(el);
  window.setTimeout(() => el.remove(), 3600);
}

async function refresh() {
  state.data = await api('/api/session');
  render();
}

function safeInitials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function dayOfWeek(date) { return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)); }
function longDate(date) { return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}
function currentMonday(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const days = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - days + (offset * 7));
  return date;
}
function dateISO(date) { return date.toLocaleDateString('en-CA'); }
function weekDates(offset = 0) {
  const monday = currentMonday(offset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return dateISO(day);
  });
}
function monthDay(date) { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)); }

function loginView(error = '') {
  app.innerHTML = `
    <main class="login-wrap">
      <aside class="login-aside">
        <a class="brand" href="#" aria-label="HRFlow home"><span class="brand-mark">H</span><span class="brand-word">HR<span>Flow</span></span></a>
        <div class="login-intro">
          <p class="eyebrow">People operations, in one place</p>
          <h1>Good work starts with a clear day.</h1>
          <p>Employee records, leave decisions, and work schedules, brought together for your team.</p>
        </div>
        <div class="login-aside-footer">A focused HR workspace for your organization.</div>
      </aside>
      <section class="login-main">
        <form class="login-panel" id="login-form">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your HRFlow workspace.</p>
          <div class="field"><label for="login-identity">Work email or username</label><input id="login-identity" name="identity" autocomplete="username" required placeholder="you@company.com" /></div>
          <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password" /></div>
          <div class="login-error" role="alert">${esc(error)}</div>
          <button class="button button-primary" type="submit" style="width:100%;min-height:44px">Sign in ${ico('right', true)}</button>
          <div class="demo-hint"><strong>Demo accounts</strong><br />Choose a role to fill in its login details.
            <div class="demo-roles"><button type="button" data-action="fill-demo" data-role="admin">Admin</button><button type="button" data-action="fill-demo" data-role="employee">Employee</button></div>
          </div>
        </form>
      </section>
    </main>`;
}

function navItems() {
  const common = [{ id: 'dashboard', label: 'Overview', icon: 'grid' }];
  const items = isAdmin()
    ? [...common, { id: 'people', label: 'People', icon: 'people' }, { id: 'leave', label: 'Leave', icon: 'plane' }, { id: 'schedule', label: 'Schedule', icon: 'calendar' }, { id: 'notifications', label: 'Notifications', icon: 'bell' }]
    : [...common, { id: 'my-leave', label: 'My leave', icon: 'plane' }, { id: 'my-schedule', label: 'My schedule', icon: 'calendar' }, { id: 'notifications', label: 'Notifications', icon: 'bell' }, { id: 'profile', label: 'My profile', icon: 'people' }];
  return items;
}

function brand() { return `<a class="brand" href="#" data-action="page" data-page="dashboard" aria-label="HRFlow overview"><span class="brand-mark">H</span><span class="brand-word">HR<span>Flow</span></span></a>`; }
function navButton(item, mobile = false) {
  const pending = item.id === 'leave' ? state.data.leaveRequests.filter((row) => row.status === 'PENDING').length : 0;
  const unread = item.id === 'notifications' ? state.data.notifications.filter((row) => !row.isRead).length : 0;
  const count = pending || unread;
  return `<button class="nav-item" data-action="page" data-page="${item.id}" aria-current="${state.page === item.id ? 'page' : 'false'}">${ico(item.icon)}<span>${esc(item.label)}</span>${count ? `<span class="nav-count" aria-label="${count} unread or pending">${count}</span>` : ''}</button>`;
}

function shell() {
  const me = state.data.employee;
  const displayName = fullName(me);
  const nav = navItems();
  const current = nav.find((item) => item.id === state.page) || nav[0];
  const pageTitles = { dashboard: 'Overview', people: 'People', leave: isAdmin() ? 'Leave requests' : 'My leave', schedule: isAdmin() ? 'Schedule' : 'My schedule', 'my-leave': 'My leave', 'my-schedule': 'My schedule', notifications: 'Notifications', profile: 'My profile' };
  const title = pageTitles[state.page] || 'Overview';
  const active = activeCount(state.data.employees || []);
  const content = pageContent();
  app.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="app-shell">
      <aside class="sidebar">
        ${brand()}
        <div class="org-chip"><span class="org-avatar">N</span><span class="org-copy"><strong>Nusa Office</strong><span>Demo workspace</span></span>${ico('chevron', true)}</div>
        <p class="nav-label">Workspace</p><nav class="nav-list" aria-label="Main navigation">${nav.map((item) => navButton(item)).join('')}</nav>
        <div class="sidebar-bottom"><div class="sidebar-divider"></div><button class="nav-item" data-action="page" data-page="${isAdmin() ? 'profile' : 'profile'}">${ico('sliders')}<span>Account</span></button>
          <div class="user-mini"><span class="avatar">${esc(initials(me))}</span><span class="user-mini-copy"><strong>${esc(displayName)}</strong><span>${esc(titleCase(state.data.user.role))}</span></span><button class="logout-button" data-action="logout" aria-label="Sign out">${ico('logout')}</button></div>
        </div>
      </aside>
      <div class="main-column">
        <header class="topbar"><div class="breadcrumb"><span>Nusa Office</span>${ico('chevron', true)}<strong>${esc(title)}</strong></div><div class="topbar-right"><span class="workspace-label">${isAdmin() ? `${active} active employees` : esc(state.data.user.position)}</span><button class="icon-button" data-action="page" data-page="notifications" aria-label="Open notifications">${ico('bell')}${state.data.notifications.some((item) => !item.isRead) ? '<span class="unread-dot"></span>' : ''}</button><button class="icon-button topbar-profile" data-action="page" data-page="profile" aria-label="Open my profile"><span>${esc(initials(me))}</span></button></div></header>
        <main class="content" id="main-content">${content}</main>
      </div>
      <nav class="mobile-nav" aria-label="Mobile navigation">${nav.slice(0, 4).map((item) => navButton(item, true)).join('')}</nav>
    </div>
    ${state.modal || ''}`;
}

function pageContent() {
  if (state.page === 'dashboard') return isAdmin() ? adminDashboard() : employeeDashboard();
  if (state.page === 'people' && isAdmin()) return peoplePage();
  if (state.page === 'leave' && isAdmin()) return adminLeavePage();
  if (state.page === 'my-leave' && !isAdmin()) return employeeLeavePage();
  if (state.page === 'schedule' && isAdmin()) return schedulePage();
  if (state.page === 'my-schedule' && !isAdmin()) return employeeSchedulePage();
  if (state.page === 'notifications') return notificationsPage();
  if (state.page === 'profile') return profilePage();
  return isAdmin() ? adminDashboard() : employeeDashboard();
}

function pageHeading(title, description, actions = '') {
  return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}
function welcomeBand(title, description, date = new Date()) {
  return `<section class="welcome-band"><div class="welcome-copy"><p class="eyebrow">${esc(longDate(date))}</p><h2>${esc(title)}</h2><p>${esc(description)}</p></div><div class="welcome-date"><span>Today is</span><strong>${new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(date)}</strong><span>${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date)}</span></div></section>`;
}
function metric(label, value, note, icon) {
  return `<article class="metric"><div><span class="metric-label">${esc(label)}</span><strong class="metric-value">${esc(value)}</strong><span class="metric-note">${esc(note)}</span></div><span class="metric-icon">${ico(icon)}</span></article>`;
}
function statusBadge(value) {
  const key = String(value).toLowerCase();
  return `<span class="status status-${esc(key)}">${esc(titleCase(value))}</span>`;
}
function personLine(person, subline = '') {
  return `<div class="person-line"><span class="avatar">${esc(initials(person))}</span><span class="person-copy"><strong>${esc(fullName(person))}</strong><span>${esc(subline || person.position || '')}</span></span></div>`;
}
function panel(title, description, body, action = '') {
  return `<section class="panel"><div class="panel-head"><div><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div>${action}</div><div class="panel-body">${body}</div></section>`;
}
function emptyState(title, description, action = '') {
  return `<div class="empty-state"><strong>${esc(title)}</strong><span>${esc(description)}</span>${action}</div>`;
}
function activeSchedules() {
  return state.data.schedules.filter((item) => item.status === 'ACTIVE').map((item) => ({ ...item, shift: state.data.shifts.find((shift) => shift.id === item.shiftId), employee: state.data.employees.find((person) => person.id === item.employeeId) || (item.employeeId === state.data.employee.id ? state.data.employee : null) })).filter((item) => item.shift && item.employee);
}
function activeRequests() {
  return state.data.leaveRequests.map((item) => ({ ...item, employee: state.data.employees.find((person) => person.id === item.employeeId) || (item.employeeId === state.data.employee.id ? state.data.employee : null), leaveType: state.data.leaveTypes.find((type) => type.id === item.leaveTypeId) })).filter((item) => item.employee && item.leaveType);
}

function adminDashboard() {
  const me = state.data.employee;
  const today = todayISO();
  const pending = activeRequests().filter((item) => item.status === 'PENDING');
  const todaySchedules = activeSchedules().filter((item) => item.workDate >= today).sort((a, b) => a.workDate.localeCompare(b.workDate) || a.shift.startTime.localeCompare(b.shift.startTime)).slice(0, 5);
  const onLeave = new Set(activeRequests().filter((item) => item.status === 'APPROVED' && today >= item.startDate && today <= item.endDate).map((item) => item.employeeId)).size;
  const next = weekDates(0);
  const day = new Date();
  const noRequests = emptyState('You’re all caught up', 'New leave requests will appear here for review.');
  return `
    ${welcomeBand(`${greeting()}, ${me.firstName}.`, 'Here’s what needs your attention across the team.')}
    <section class="metric-grid" aria-label="Team overview">
      ${metric('Active employees', activeCount(state.data.employees), 'Across all departments', 'people')}
      ${metric('Leave to review', pending.length, pending.length ? 'Waiting for your decision' : 'No requests waiting', 'plane')}
      ${metric('On leave today', onLeave, onLeave ? 'Approved leave in progress' : 'No approved leave today', 'calendar')}
      ${metric('Upcoming shifts', activeSchedules().filter((item) => item.workDate >= today).length, 'Scheduled from today onward', 'clock')}
    </section>
    <div class="dashboard-grid">
      <div class="stack">
        ${panel('Leave requests', `${pending.length} awaiting a decision`, pending.length ? `<div class="request-list">${pending.slice(0, 4).map((request) => `<article class="request-row">${personLine(request.employee, `${request.leaveType.name} · ${formatRange(request.startDate, request.endDate)} · ${request.days} ${request.days === 1 ? 'day' : 'days'}`)}<div class="request-actions"><button class="button button-sm button-primary" data-action="approve-leave" data-id="${esc(request.id)}">Approve</button><button class="button button-sm" data-action="reject-leave" data-id="${esc(request.id)}">Review</button></div></article>`).join('')}</div>` : noRequests, `<button class="inline-link" data-action="page" data-page="leave">View queue</button>`)}
        ${panel('Upcoming shifts', 'Next scheduled assignments', todaySchedules.length ? `<div class="shift-list">${todaySchedules.map((item) => `<div class="shift-row"><span class="shift-time">${esc(item.shift.startTime)}</span><span class="shift-person"><strong>${esc(fullName(item.employee))}</strong><span>${esc(item.shift.name)} · ${esc(item.employee.department)}</span></span><span class="shift-day">${item.workDate === today ? 'Today' : dateLabel(item.workDate, { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>`).join('')}</div>` : emptyState('No shifts scheduled', 'Assign a shift to put the week in motion.', `<button class="button button-sm button-primary" data-action="open-schedule">Assign a shift</button>`), `<button class="inline-link" data-action="page" data-page="schedule">Open schedule</button>`)}
      </div>
      <div class="stack">
        ${panel('This week', 'A quick view of who is working', `<div class="mini-calendar">${next.map((date) => `<div class="mini-day ${date === today ? 'today' : ''} ${activeSchedules().some((item) => item.workDate === date) ? 'has-shift' : ''}"><span>${esc(dayOfWeek(date))}</span><strong>${new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(new Date(`${date}T12:00:00`))}</strong></div>`).join('')}</div>`, `<button class="inline-link" data-action="page" data-page="schedule">Full schedule</button>`)}
        ${panel('People at a glance', `${new Set(state.data.employees.filter((item) => item.status === 'ACTIVE').map((item) => item.department)).size} departments`, `<div class="balance-list">${state.data.departments.filter((item) => item.status === 'ACTIVE').map((department) => { const count = state.data.employees.filter((item) => item.status === 'ACTIVE' && item.department === department.name).length; return `<div class="balance-row"><span class="balance-name">${esc(department.name)}</span><span class="balance-number">${count}</span><div class="balance-track"><div class="balance-fill" style="width:${Math.max(6, Math.round(count / Math.max(1, activeCount(state.data.employees)) * 100))}%"></div></div></div>`; }).join('')}</div>`, `<button class="inline-link" data-action="page" data-page="people">People directory</button>`)}
        ${panel('Recent activity', 'Latest changes across your workspace', state.data.notifications.length ? `<div class="shift-list">${[...state.data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map((item) => `<div class="shift-row"><span class="notification-symbol">${ico(item.type === 'schedule' ? 'calendar' : 'plane', true)}</span><span class="shift-person"><strong>${esc(item.title)}</strong><span>${esc(item.message)}</span></span><span class="shift-day">${esc(dateLabel(item.createdAt.slice(0, 10)))}</span></div>`).join('')}</div>` : emptyState('No activity yet', 'Important changes will appear here.'), `<button class="inline-link" data-action="page" data-page="notifications">View notifications</button>`)}
      </div>
    </div>`;
}

function employeeDashboard() {
  const me = state.data.employee;
  const requests = activeRequests().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const ownRequests = requests.filter((item) => item.employeeId === me.id);
  const upcoming = activeSchedules().filter((item) => item.employeeId === me.id && item.workDate >= todayISO()).sort((a, b) => a.workDate.localeCompare(b.workDate)).slice(0, 5);
  const pending = ownRequests.filter((item) => item.status === 'PENDING').length;
  const annual = me.annualBalance ?? 0;
  const sick = me.sickBalance ?? 0;
  const personal = me.personalBalance ?? 0;
  return `
    ${welcomeBand(`${greeting()}, ${me.firstName}.`, 'Your schedule and requests, all in one place.')}
    <section class="metric-grid" aria-label="Your HR overview">
      ${metric('Annual leave', `${annual} days`, 'Available balance', 'plane')}
      ${metric('Sick leave', `${sick} days`, 'Available balance', 'info')}
      ${metric('Personal leave', `${personal} days`, 'Available balance', 'calendar')}
      ${metric('Requests in review', pending, pending ? 'Waiting for your manager' : 'No requests in review', 'clock')}
    </section>
    <div class="dashboard-grid">
      <div class="stack">
        ${panel('Your upcoming shifts', 'Your confirmed work assignments coming up.', upcoming.length ? `<div class="shift-list">${upcoming.map((item) => `<div class="shift-row"><span class="shift-time">${esc(item.shift.startTime)}</span><span class="shift-person"><strong>${esc(item.shift.name)}</strong><span>${esc(item.workDate === todayISO() ? 'Today' : dateLabel(item.workDate, { weekday: 'long', day: 'numeric', month: 'short' }))} · ${esc(item.shift.startTime)}–${esc(item.shift.endTime)}</span></span>${statusBadge('ACTIVE')}</div>`).join('')}</div>` : emptyState('No shifts assigned yet', 'Your admin will post new shifts here when they are ready.', `<button class="button button-sm" data-action="page" data-page="my-schedule">View schedule</button>`), `<button class="inline-link" data-action="page" data-page="my-schedule">Full schedule</button>`)}
        ${panel('Recent leave requests', 'Check the latest status from your manager', ownRequests.length ? `<div class="request-list">${ownRequests.slice(0, 4).map((request) => `<article class="request-row"><div class="person-copy"><strong>${esc(request.leaveType.name)} · ${esc(formatRange(request.startDate, request.endDate))}</strong><span>${esc(request.days)} ${request.days === 1 ? 'day' : 'days'} · Submitted ${esc(dateLabel(request.submittedAt.slice(0, 10)))}</span>${request.status === 'REJECTED' && request.rejectionReason ? `<span>${esc(request.rejectionReason)}</span>` : ''}</div>${statusBadge(request.status)}</article>`).join('')}</div>` : emptyState('No leave requests yet', 'Submit a request whenever you need time away.', `<button class="button button-sm button-primary" data-action="open-leave">Request leave</button>`), `<button class="inline-link" data-action="page" data-page="my-leave">Leave history</button>`)}
      </div>
      <div class="stack">
        ${panel('Leave balances', 'Days available to request', `<div class="balance-list">${[['Annual leave', annual, 14], ['Sick leave', sick, 8], ['Personal leave', personal, 3]].map(([name, available, total]) => `<div class="balance-row"><span class="balance-name">${esc(name)}</span><span class="balance-number">${available} days</span><div class="balance-track"><div class="balance-fill" style="width:${Math.max(0, Math.min(100, available / total * 100))}%"></div></div></div>`).join('')}</div>`, `<button class="inline-link" data-action="open-leave">New request</button>`)}
        ${panel('Recent notifications', 'Updates from your manager and HR', state.data.notifications.length ? `<div class="notification-list">${[...state.data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map((item) => `<article class="notification-row ${item.isRead ? '' : 'unread'}"><span class="notification-symbol">${ico(item.type === 'schedule' ? 'calendar' : 'plane', true)}</span><div class="notification-copy"><strong>${esc(item.title)}</strong><p>${esc(item.message)}</p></div></article>`).join('')}</div>` : emptyState('No new updates', 'Your leave decisions and schedule changes will appear here.'), `<button class="inline-link" data-action="page" data-page="notifications">View all</button>`)}
      </div>
    </div>`;
}

function peoplePage() {
  const tabs = ['employees', 'departments', 'positions'];
  const tabLabels = { employees: 'Employees', departments: 'Departments', positions: 'Positions' };
  const actionLabel = state.directoryTab === 'employees' ? 'Add employee' : `Add ${state.directoryTab === 'departments' ? 'department' : 'position'}`;
  const addAction = state.directoryTab === 'employees' ? 'open-employee' : 'open-org-item';
  const filtered = state.data.employees.filter((person) => (state.employeeStatusFilter === 'ALL' || person.status === state.employeeStatusFilter) && `${fullName(person)} ${person.id} ${person.email} ${person.department} ${person.position}`.toLowerCase().includes(state.search.toLowerCase()));
  const employeesBody = `<div class="table-tools"><label class="search-box">${ico('search', true)}<span class="sr-only">Search employees</span><input id="people-search" type="search" placeholder="Search name, ID, department…" value="${esc(state.search)}" /></label><select class="filter-select" id="department-filter" aria-label="Filter by department"><option value="ALL">All departments</option>${state.data.departments.filter((item) => item.status === 'ACTIVE').map((item) => `<option value="${esc(item.name)}" ${state.departmentFilter === item.name ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select><select class="filter-select" id="position-filter" aria-label="Filter by position"><option value="ALL">All positions</option>${state.data.positions.filter((item) => item.status === 'ACTIVE').map((item) => `<option value="${esc(item.name)}" ${state.positionFilter === item.name ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select><select class="filter-select" id="employee-status-filter" aria-label="Filter by employment status"><option value="ACTIVE" ${state.employeeStatusFilter === 'ACTIVE' ? 'selected' : ''}>Active employees</option><option value="INACTIVE" ${state.employeeStatusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive employees</option><option value="ALL" ${state.employeeStatusFilter === 'ALL' ? 'selected' : ''}>All statuses</option></select></div>
    <div class="table-wrap"><table><thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Position</th><th>Leave balance</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${filtered.filter((person) => (state.departmentFilter === 'ALL' || person.department === state.departmentFilter) && (state.positionFilter === 'ALL' || person.position === state.positionFilter)).map((person) => `<tr><td><div class="cell-person"><span class="avatar">${esc(initials(person))}</span><span><strong>${esc(fullName(person))}</strong><span>${esc(person.email)}</span></span></div></td><td>${esc(person.id)}</td><td>${esc(person.department)}</td><td>${esc(person.position)}</td><td>${esc(person.annualBalance)} days</td><td>${statusBadge(person.status)}</td><td><div class="cell-actions"><button class="button button-sm" data-action="edit-employee" data-id="${esc(person.id)}">Edit</button>${person.status === 'ACTIVE' ? `<button class="button button-sm button-danger" data-action="deactivate-employee" data-id="${esc(person.id)}">Deactivate</button>` : `<button class="button button-sm" data-action="activate-employee" data-id="${esc(person.id)}">Reactivate</button>`}</div></td></tr>`).join('') || '<tr><td class="no-rows" colspan="7">No employees match those filters.</td></tr>'}</tbody></table></div>`;
  const list = state.directoryTab === 'departments' ? state.data.departments : state.data.positions;
  const orgBody = `<div class="table-wrap"><table><thead><tr><th>${state.directoryTab === 'departments' ? 'Department' : 'Position'}</th><th>People</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${list.map((item) => { const count = state.directoryTab === 'departments' ? state.data.employees.filter((person) => person.status === 'ACTIVE' && person.department === item.name).length : state.data.employees.filter((person) => person.status === 'ACTIVE' && person.position === item.name).length; return `<tr><td><strong>${esc(item.name)}</strong></td><td>${count}</td><td>${statusBadge(item.status)}</td><td><div class="cell-actions"><button class="button button-sm" data-action="edit-org-item" data-kind="${state.directoryTab}" data-id="${esc(item.id)}">Rename</button>${item.status === 'ACTIVE' ? `<button class="button button-sm button-danger" data-action="deactivate-org-item" data-kind="${state.directoryTab}" data-id="${esc(item.id)}">Deactivate</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>`;
  return `${pageHeading('People', 'Employee records, departments, and positions in one directory.', `<button class="button button-primary" data-action="${addAction}">${ico('plus', true)}${actionLabel}</button>`)}
    <section class="panel"><div class="tab-strip" role="tablist" aria-label="People directory">${tabs.map((tab) => `<button class="tab-button" role="tab" aria-selected="${state.directoryTab === tab}" data-action="directory-tab" data-tab="${tab}">${tabLabels[tab]}</button>`).join('')}</div>${state.directoryTab === 'employees' ? employeesBody : orgBody}</section>`;
}

function adminLeavePage() {
  const filter = state.leaveFilter;
  const requests = activeRequests().filter((item) => filter === 'ALL' || item.status === filter).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const action = `<button class="button" data-action="open-leave-type">${ico('sliders', true)}Manage leave types</button>`;
  return `${pageHeading('Leave requests', 'Review employee time off and keep balances accurate.', action)}
    <section class="panel"><div class="tab-strip" role="tablist" aria-label="Filter leave requests">${['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => `<button class="tab-button" role="tab" aria-selected="${filter === status}" data-action="leave-filter" data-filter="${status}">${status === 'ALL' ? 'All requests' : titleCase(status)}${status === 'PENDING' ? ` · ${activeRequests().filter((item) => item.status === 'PENDING').length}` : ''}</button>`).join('')}</div>
      <div class="table-wrap"><table><thead><tr><th>Employee</th><th>Leave type</th><th>Dates</th><th>Days</th><th>Submitted</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${requests.map((request) => `<tr><td><div class="cell-person"><span class="avatar">${esc(initials(request.employee))}</span><span><strong>${esc(fullName(request.employee))}</strong><span>${esc(request.employee.department)}</span></span></div></td><td>${esc(request.leaveType.name)}</td><td>${esc(formatRange(request.startDate, request.endDate))}</td><td>${request.days}</td><td>${esc(dateLabel(request.submittedAt.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }))}</td><td><span title="${esc(request.rejectionReason || '')}">${statusBadge(request.status)}</span></td><td><div class="cell-actions">${request.status === 'PENDING' ? `<button class="button button-sm button-primary" data-action="approve-leave" data-id="${esc(request.id)}">Approve</button><button class="button button-sm" data-action="reject-leave" data-id="${esc(request.id)}">Decline</button>` : request.rejectionReason ? `<button class="button button-sm" data-action="view-reason" data-id="${esc(request.id)}">Reason</button>` : ''}</div></td></tr>`).join('') || `<tr><td class="no-rows" colspan="7">${filter === 'ALL' ? 'No leave requests yet.' : `No ${titleCase(filter).toLowerCase()} requests.`}</td></tr>`}</tbody></table></div>
    </section>`;
}

function employeeLeavePage() {
  const requests = activeRequests().filter((item) => item.employeeId === state.data.employee.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const action = `<button class="button button-primary" data-action="open-leave">${ico('plus', true)}Request leave</button>`;
  return `${pageHeading('My leave', 'Your available days and the status of every request.', action)}
    <section class="metric-grid" aria-label="Leave balances">${metric('Annual leave', `${state.data.employee.annualBalance} days`, 'Available balance', 'plane')}${metric('Sick leave', `${state.data.employee.sickBalance} days`, 'Available balance', 'info')}${metric('Personal leave', `${state.data.employee.personalBalance} days`, 'Available balance', 'calendar')}${metric('Requests in review', requests.filter((item) => item.status === 'PENDING').length, 'Waiting for a decision', 'clock')}</section>
    <section class="panel"><div class="panel-head"><div><h2>Request history</h2><p>Approved leave updates your balance once it is reviewed.</p></div></div><div class="table-wrap"><table><thead><tr><th>Leave type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Submitted</th><th>Decision date</th><th>Status</th></tr></thead><tbody>${requests.map((request) => `<tr><td>${esc(request.leaveType.name)}</td><td>${esc(formatRange(request.startDate, request.endDate))}</td><td>${request.days}</td><td><span title="${esc(request.rejectionReason || request.reason)}">${esc(request.reason)}</span>${request.rejectionReason ? `<br /><span class="cell-muted">${esc(request.rejectionReason)}</span>` : ''}</td><td>${esc(dateLabel(request.submittedAt.slice(0, 10)))}</td><td>${request.reviewedAt ? esc(dateLabel(request.reviewedAt.slice(0, 10))) : 'Pending'}</td><td>${statusBadge(request.status)}</td></tr>`).join('') || '<tr><td class="no-rows" colspan="7">No leave history yet. Submit a request to get started.</td></tr>'}</tbody></table></div></section>`;
}

function rangeHeadingAction() {
  const dates = weekDates(state.weekOffset);
  return `<div class="week-bar"><button class="icon-button" data-action="week-prev" aria-label="Previous week">${ico('left', true)}</button><span class="week-label">${esc(monthDay(dates[0]))} – ${esc(monthDay(dates[6]))}</span><button class="icon-button" data-action="week-next" aria-label="Next week">${ico('right', true)}</button></div>`;
}
function schedulePage() {
  const dates = weekDates(state.weekOffset);
  const weekSchedules = activeSchedules().filter((item) => dates.includes(item.workDate));
  const roster = isAdmin() ? state.data.employees : [state.data.employee];
  const people = roster.filter((item) => item.status === 'ACTIVE' && (state.departmentFilter === 'ALL' || item.department === state.departmentFilter) && `${fullName(item)} ${item.id}`.toLowerCase().includes(state.scheduleSearch.toLowerCase()) && (state.scheduleShiftFilter === 'ALL' || weekSchedules.some((assignment) => assignment.employeeId === item.id && assignment.shiftId === state.scheduleShiftFilter)));
  const scheduleIndex = new Map(activeSchedules().map((item) => [`${item.employeeId}:${item.workDate}`, item]));
  const headers = dates.map((date) => `<th>${esc(dayOfWeek(date))}<br /><span class="cell-muted">${esc(monthDay(date))}</span></th>`).join('');
  const rows = people.map((person) => `<tr><td><div class="cell-person"><span class="avatar">${esc(initials(person))}</span><span><strong>${esc(fullName(person))}</strong><span>${esc(person.department)}</span></span></div></td>${dates.map((date) => { const item = scheduleIndex.get(`${person.id}:${date}`); return `<td>${item ? `<button class="schedule-cell" ${isAdmin() ? `data-action="edit-schedule" data-id="${esc(item.id)}"` : ''} ${!isAdmin() ? 'disabled' : ''}><strong>${esc(item.shift.name)}</strong><span>${esc(item.shift.startTime)}–${esc(item.shift.endTime)}</span></button>` : isAdmin() ? `<button class="button button-quiet button-sm" data-action="open-schedule" data-employee="${esc(person.id)}" data-date="${esc(date)}" aria-label="Assign ${esc(fullName(person))} on ${esc(date)}">${ico('plus', true)}</button>` : '<span class="schedule-empty">-</span>'}</td>`; }).join('')}</tr>`).join('');
  const headingActions = `<button class="button" data-action="open-shift">${ico('sliders', true)}Manage shifts</button><button class="button button-primary" data-action="open-schedule">${ico('plus', true)}Assign shift</button>`;
  return `${pageHeading('Schedule', isAdmin() ? 'Assign shifts and catch conflicts before they reach your team.' : 'Your shifts for the week ahead.', isAdmin() ? headingActions : '')}
    <section class="panel"><div class="panel-head schedule-panel-head"><div><h2>${isAdmin() ? 'Team roster' : 'My roster'}</h2><p>${isAdmin() ? `${people.length} team members · select a shift to edit it` : 'Your confirmed work schedule'}</p></div><div class="heading-actions">${isAdmin() ? `<select class="filter-select" id="schedule-department-filter" aria-label="Filter schedules by department"><option value="ALL">All departments</option>${state.data.departments.filter((item) => item.status === 'ACTIVE').map((item) => `<option ${state.departmentFilter === item.name ? 'selected' : ''} value="${esc(item.name)}">${esc(item.name)}</option>`).join('')}</select><select class="filter-select" id="schedule-shift-filter" aria-label="Filter schedules by shift"><option value="ALL">All shifts</option>${state.data.shifts.filter((item) => item.status === 'ACTIVE').map((item) => `<option value="${esc(item.id)}" ${state.scheduleShiftFilter === item.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select><label class="search-box schedule-search">${ico('search', true)}<span class="sr-only">Search employees</span><input id="schedule-search" type="search" value="${esc(state.scheduleSearch)}" placeholder="Employee name or ID" /></label>` : ''}${rangeHeadingAction()}</div></div><div class="table-wrap"><table class="schedule-table"><thead><tr><th>Employee</th>${headers}</tr></thead><tbody>${rows || '<tr><td class="no-rows" colspan="8">No active employees to schedule.</td></tr>'}</tbody></table></div></section>`;
}
function employeeSchedulePage() {
  return schedulePage();
}

function notificationsPage() {
  const list = [...state.data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const action = list.some((item) => !item.isRead) ? `<button class="button" data-action="read-all">Mark all as read</button>` : '';
  return `${pageHeading('Notifications', 'Leave decisions and schedule updates from your workspace.', action)}<section class="panel"><div class="notification-list">${list.map((item) => `<article class="notification-row ${item.isRead ? '' : 'unread'}"><span class="notification-symbol">${ico(item.type === 'schedule' ? 'calendar' : item.type === 'leave' ? 'plane' : 'info', true)}</span><div class="notification-copy"><strong>${esc(item.title)}</strong><p>${esc(item.message)}</p><time datetime="${esc(item.createdAt)}">${esc(new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt)))}</time></div>${item.isRead ? '' : `<span class="unread-label">Unread</span>`}</article>`).join('') || '<div class="no-rows">You’re all caught up. New updates will appear here.</div>'}</div></section>`;
}

function profilePage() {
  const me = state.data.employee;
  return `${pageHeading('My profile', 'Your employee information at a glance.', `<button class="button" data-action="logout">${ico('logout', true)}Sign out</button>`)}
    <div class="profile-grid"><section class="panel profile-card"><div class="profile-top"><span class="avatar">${esc(initials(me))}</span><div><h2>${esc(fullName(me))}</h2><p>${esc(me.position)} · ${esc(me.department)}</p></div></div><div class="profile-info"><div><small>Employee ID</small><strong>${esc(me.id)}</strong></div><div><small>Employment status</small>${statusBadge(me.status)}</div><div><small>Work email</small><strong>${esc(me.email)}</strong></div><div><small>Phone</small><strong>${esc(me.phone || 'Not provided')}</strong></div><div><small>Hire date</small><strong>${esc(dateLabel(me.hireDate, { day: 'numeric', month: 'long', year: 'numeric' }))}</strong></div><div><small>Role</small><strong>${esc(titleCase(me.role))}</strong></div></div></section>
      ${panel('Time away', 'Current balance by leave type', `<div class="balance-list">${state.data.leaveTypes.map((type) => { const balance = me[type.balanceField] || 0; return `<div class="balance-row"><span class="balance-name">${esc(type.name)}</span><span class="balance-number">${balance} days</span><div class="balance-track"><div class="balance-fill" style="width:${Math.min(100, balance / 14 * 100)}%"></div></div></div>`; }).join('')}</div>`, `<button class="inline-link" data-action="page" data-page="${isAdmin() ? 'leave' : 'my-leave'}">View requests</button>`)}</div>`;
}

function modalFrame(title, description, fields, formAction, submitLabel = 'Save') {
  return `<div class="modal-backdrop" data-action="dismiss-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div><button class="modal-close" data-action="close-modal" aria-label="Close">${ico('close', true)}</button></div><div class="modal-body"><form data-form="${formAction}">${fields}<div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${esc(submitLabel)}</button></div></form></div></section></div>`;
}
function fieldHtml(label, name, value = '', type = 'text', placeholder = '', required = true, extra = '') {
  return `<div class="field ${extra}"><label for="form-${esc(name)}">${esc(label)}</label><input id="form-${esc(name)}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${required ? 'required' : ''} /></div>`;
}
function selectHtml(label, name, options, selected = '', extra = '') {
  return `<div class="field ${extra}"><label for="form-${esc(name)}">${esc(label)}</label><select id="form-${esc(name)}" name="${esc(name)}" required>${options.map((option) => `<option value="${esc(option.value)}" ${String(option.value) === String(selected) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div>`;
}
let modalReturnFocus = null;
function showModal(html) { modalReturnFocus = document.activeElement; state.modal = html; render(); const focus = document.querySelector('.modal input, .modal select, .modal textarea, .modal button'); focus?.focus(); }
function closeModal() { state.modal = null; render(); modalReturnFocus?.focus?.(); modalReturnFocus = null; }

function openLeaveModal() {
  const me = state.data.employee;
  const options = state.data.leaveTypes.filter((type) => type.status === 'ACTIVE').map((type) => ({ value: type.id, label: `${type.name} · ${me[type.balanceField] || 0} days available` }));
  const fields = `<div class="form-grid">${selectHtml('Leave type', 'leaveTypeId', options, options[0]?.value)}${fieldHtml('Start date', 'startDate', '', 'date')}${fieldHtml('End date', 'endDate', '', 'date')}${fieldHtml('Reason', 'reason', '', 'text', 'Tell your manager a little about your request', true, 'span-two')}<p class="form-hint span-two">Requested days are counted as calendar days. Dates overlapping a pending or approved request cannot be submitted.</p></div>`;
  showModal(modalFrame('Request leave', 'Choose your leave type and the dates you need.', fields, 'leave-create', 'Send request'));
}
function openEmployeeModal(person = null) {
  const editing = Boolean(person);
  const departments = state.data.departments.filter((item) => item.status === 'ACTIVE').map((item) => ({ value: item.name, label: item.name }));
  const positions = state.data.positions.filter((item) => item.status === 'ACTIVE').map((item) => ({ value: item.name, label: item.name }));
  const idField = editing ? `<p class="form-hint span-two">Employee ID: <strong>${esc(person.id)}</strong></p>` : fieldHtml('Employee ID', 'employeeNumber', `HF-${String(state.data.employees.length + 1).padStart(3, '0')}`, 'text', 'HF-008');
  const fields = `<div class="form-grid">${idField}${fieldHtml('First name', 'firstName', person?.firstName || '')}${fieldHtml('Last name', 'lastName', person?.lastName || '')}${fieldHtml('Work email', 'email', person?.email || '', 'email')}${fieldHtml('Phone', 'phone', person?.phone || '', 'tel', 'Optional', false)}${selectHtml('Department', 'department', departments, person?.department || departments[0]?.value)}${selectHtml('Position', 'position', positions, person?.position || positions[0]?.value)}${fieldHtml('Hire date', 'hireDate', person?.hireDate || todayISO(), 'date')}${fieldHtml('Annual leave balance', 'annualBalance', person?.annualBalance ?? 12, 'number', '', true, '')}${editing ? '' : `${fieldHtml('Username', 'username', '', 'text', 'Defaults to email name', false)}${fieldHtml('Temporary password', 'password', 'Welcome123!', 'text', '', true)}`}<p class="form-hint span-two">${editing ? 'Changes are visible to the employee on their next sign-in.' : 'A demo password is pre-filled for this prototype. Ask the employee to change it before real use.'}</p></div>`;
  const html = modalFrame(editing ? 'Edit employee' : 'Add employee', editing ? 'Keep the employee record up to date.' : 'Create a profile and sign-in for a new employee.', fields, editing ? `employee-edit:${person.id}` : 'employee-create', editing ? 'Save changes' : 'Create employee');
  showModal(html);
}
function openOrgModal(kind, item = null) {
  const label = kind === 'departments' ? 'department' : 'position';
  const fields = fieldHtml(`${titleCase(label)} name`, 'name', item?.name || '', 'text', `${titleCase(label)} name`);
  showModal(modalFrame(item ? `Rename ${label}` : `Add ${label}`, item ? `Update the name used for this ${label} across employee records.` : `Create a ${label} for employee records.`, fields, `${item ? `org-edit:${kind}:${item.id}` : `org-create:${kind}`}`, item ? 'Save name' : `Add ${label}`));
}
function openShiftModal(shift = null) {
  const fields = `<div class="form-grid">${fieldHtml('Shift name', 'name', shift?.name || '', 'text', 'e.g. Office hours')}${fieldHtml('Start time', 'startTime', shift?.startTime || '09:00', 'time')}${fieldHtml('End time', 'endTime', shift?.endTime || '17:00', 'time')}</div><p class="form-hint">An end time earlier than the start time is treated as an overnight shift.</p>`;
  showModal(modalFrame(shift ? 'Edit shift' : 'Create a shift', 'Set the work period that admins can assign to employees.', fields, shift ? `shift-edit:${shift.id}` : 'shift-create', shift ? 'Save shift' : 'Create shift'));
}
function openScheduleModal(schedule = null, employeeId = '', workDate = '') {
  const people = state.data.employees.filter((item) => item.status === 'ACTIVE');
  const shiftOptions = state.data.shifts.filter((item) => item.status === 'ACTIVE').map((item) => ({ value: item.id, label: `${item.name} · ${item.startTime}–${item.endTime}` }));
  const personOptions = people.map((person) => ({ value: person.id, label: `${fullName(person)} · ${person.department}` }));
  const existingEmployeeId = schedule?.employeeId || employeeId;
  const fields = `<div class="form-grid">${selectHtml('Employee', 'employeeId', personOptions, existingEmployeeId || personOptions[0]?.value, 'span-two')}${selectHtml('Shift', 'shiftId', shiftOptions, schedule?.shiftId || shiftOptions[0]?.value, 'span-two')}${fieldHtml('Work date', 'workDate', schedule?.workDate || workDate || todayISO(), 'date')}</div><p class="form-hint">HRFlow checks for overlapping shifts and approved leave before saving.</p>`;
  let html = modalFrame(schedule ? 'Edit assignment' : 'Assign a shift', 'Choose who is working and when.', fields, schedule ? `schedule-edit:${schedule.id}` : 'schedule-create', schedule ? 'Save assignment' : 'Assign shift');
  if (schedule) html = html.replace('<div class="modal-actions">', `<div class="modal-actions"><button class="button button-danger" type="button" data-action="schedule-delete" data-id="${esc(schedule.id)}">Remove assignment</button><span class="filters-spacer"></span>`);
  showModal(html);
}
function openLeaveTypeModal(type = null) {
  const balanceOptions = [
    { value: 'annualBalance', label: 'Annual leave balance' },
    { value: 'sickBalance', label: 'Sick leave balance' },
    { value: 'personalBalance', label: 'Personal leave balance' },
  ];
  const fields = `<div class="form-grid">${fieldHtml('Leave type name', 'name', type?.name || '', 'text', 'e.g. Bereavement leave')}${selectHtml('Uses this balance', 'balanceField', balanceOptions, type?.balanceField || balanceOptions[0].value)}</div><p class="form-hint">The balance category defines which remaining-day total is checked when a request is submitted.</p>`;
  showModal(modalFrame(type ? 'Edit leave type' : 'Add leave type', 'Keep leave categories clear for employees and managers.', fields, type ? `leave-type-edit:${type.id}` : 'leave-type-create', type ? 'Save type' : 'Add leave type'));
}
function openConfirm(title, description, action, id, kind) {
  showModal(`<div class="modal-backdrop" data-action="dismiss-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2><p>${esc(description)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${ico('close', true)}</button></div><div class="modal-body"><div class="modal-actions"><button class="button" data-action="close-modal">Cancel</button><button class="button button-danger" data-action="${action}" data-id="${esc(id)}" ${kind ? `data-kind="${esc(kind)}"` : ''}>Continue</button></div></div></section></div>`);
}
function openRejectModal(id) {
  const fields = `<div class="field"><label for="form-reason">Reason for declining</label><textarea id="form-reason" name="reason" required maxlength="500" placeholder="Share a brief reason the employee can understand"></textarea></div>`;
  showModal(modalFrame('Decline this request?', 'The employee will be notified and can see your reason.', fields, `leave-reject:${id}`, 'Decline request'));
}

async function afterMutation(message) {
  closeModal();
  toast(message);
  await refresh();
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function submitForm(form) {
  const action = form.dataset.form;
  const data = readForm(form);
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    if (action === 'leave-create') {
      await api('/api/leave-requests', { method: 'POST', body: data });
      await afterMutation('Your leave request has been sent to HR.');
    } else if (action === 'employee-create') {
      await api('/api/employees', { method: 'POST', body: data });
      await afterMutation('Employee profile created.');
    } else if (action.startsWith('employee-edit:')) {
      await api(`/api/employees/${encodeURIComponent(action.split(':')[1])}`, { method: 'PUT', body: data });
      await afterMutation('Employee profile updated.');
    } else if (action.startsWith('org-create:')) {
      const kind = action.split(':')[1];
      await api(`/api/${kind}`, { method: 'POST', body: data });
      await afterMutation(`${titleCase(kind.slice(0, -1))} added.`);
    } else if (action.startsWith('org-edit:')) {
      const [, kind, id] = action.split(':');
      await api(`/api/${kind}/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
      await afterMutation(`${titleCase(kind.slice(0, -1))} renamed.`);
    } else if (action === 'shift-create') {
      await api('/api/shifts', { method: 'POST', body: data });
      await afterMutation('Shift created.');
    } else if (action.startsWith('shift-edit:')) {
      await api(`/api/shifts/${encodeURIComponent(action.split(':')[1])}`, { method: 'PUT', body: data });
      await afterMutation('Shift updated.');
    } else if (action === 'schedule-create') {
      await api('/api/schedules', { method: 'POST', body: data });
      await afterMutation('Shift assigned. The employee has been notified.');
    } else if (action.startsWith('schedule-edit:')) {
      await api(`/api/schedules/${encodeURIComponent(action.split(':')[1])}`, { method: 'PUT', body: data });
      await afterMutation('Schedule assignment updated.');
    } else if (action === 'leave-type-create') {
      await api('/api/leave-types', { method: 'POST', body: data });
      await afterMutation('Leave type added.');
    } else if (action.startsWith('leave-type-edit:')) {
      await api(`/api/leave-types/${encodeURIComponent(action.split(':')[1])}`, { method: 'PUT', body: data });
      await afterMutation('Leave type updated.');
    } else if (action.startsWith('leave-reject:')) {
      await api(`/api/leave-requests/${encodeURIComponent(action.split(':')[1])}/reject`, { method: 'POST', body: data });
      await afterMutation('Leave request declined. The employee has been notified.');
    }
  } catch (error) {
    button.disabled = false;
    const old = form.querySelector('.form-error');
    old?.remove();
    const note = document.createElement('p');
    note.className = 'form-hint form-error';
    note.style.color = 'var(--brick)';
    note.setAttribute('role', 'alert');
    note.textContent = error.message;
    form.querySelector('.modal-actions')?.before(note);
  }
}

async function clickAction(target) {
  const action = target.dataset.action;
  if (!action) return;
  if (action === 'page') { state.page = target.dataset.page; state.search = ''; render(); return; }
  if (action === 'directory-tab') { state.directoryTab = target.dataset.tab; state.search = ''; render(); return; }
  if (action === 'leave-filter') { state.leaveFilter = target.dataset.filter; render(); return; }
  if (action === 'fill-demo') {
    document.querySelector('#login-identity').value = target.dataset.role === 'admin' ? 'maya@hrflow.local' : 'daniel@hrflow.local';
    document.querySelector('#login-password').value = target.dataset.role === 'admin' ? 'Admin123!' : 'Employee123!';
    document.querySelector('#login-password').focus();
    return;
  }
  if (action === 'logout') { signOut(true); return; }
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'dismiss-modal' && target.classList.contains('modal-backdrop')) { closeModal(); return; }
  if (action === 'open-leave') { openLeaveModal(); return; }
  if (action === 'open-employee') { openEmployeeModal(); return; }
  if (action === 'edit-employee') { openEmployeeModal(state.data.employees.find((person) => person.id === target.dataset.id)); return; }
  if (action === 'deactivate-employee') { const person = state.data.employees.find((item) => item.id === target.dataset.id); openConfirm('Deactivate employee?', `${fullName(person)} will no longer be able to sign in. Their past records will remain in HRFlow.`, 'confirm-deactivate-employee', person.id); return; }
  if (action === 'activate-employee') {
    try { await api(`/api/employees/${encodeURIComponent(target.dataset.id)}/activate`, { method: 'POST', body: {} }); await afterMutation('Employee account reactivated.'); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'confirm-deactivate-employee') {
    try { await api(`/api/employees/${encodeURIComponent(target.dataset.id)}/deactivate`, { method: 'POST' }); await afterMutation('Employee deactivated.'); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'open-org-item') { openOrgModal(state.directoryTab); return; }
  if (action === 'edit-org-item') { const collection = target.dataset.kind; const item = state.data[collection].find((entry) => entry.id === target.dataset.id); openOrgModal(collection, item); return; }
  if (action === 'deactivate-org-item') {
    const collection = target.dataset.kind;
    const item = state.data[collection].find((entry) => entry.id === target.dataset.id);
    openConfirm(`Deactivate ${collection.slice(0, -1)}?`, `${item.name} will no longer appear in new employee records. Existing history is preserved.`, 'confirm-deactivate-org-item', item.id, collection); return;
  }
  if (action === 'confirm-deactivate-org-item') {
    try { await api(`/api/${target.dataset.kind}/${encodeURIComponent(target.dataset.id)}`, { method: 'DELETE' }); await afterMutation(`${titleCase(target.dataset.kind.slice(0, -1))} deactivated.`); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'approve-leave') {
    try { await api(`/api/leave-requests/${encodeURIComponent(target.dataset.id)}/approve`, { method: 'POST', body: {} }); await refresh(); toast('Leave approved and the employee balance has been updated.'); }
    catch (error) { toast(error.message, true); }
    return;
  }
  if (action === 'reject-leave') { openRejectModal(target.dataset.id); return; }
  if (action === 'view-reason') { const request = state.data.leaveRequests.find((item) => item.id === target.dataset.id); showModal(`<div class="modal-backdrop" data-action="dismiss-modal"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Reason for declining</h2><p>${esc(request.leaveTypeId && state.data.leaveTypes.find((item) => item.id === request.leaveTypeId)?.name || 'Leave request')}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${ico('close', true)}</button></div><div class="modal-body"><p style="margin:0 0 17px;color:#435047;font-size:12px;line-height:1.6">${esc(request.rejectionReason)}</p><div class="modal-actions"><button class="button button-primary" data-action="close-modal">Close</button></div></div></section></div>`); return; }
  if (action === 'open-schedule') { openScheduleModal(null, target.dataset.employee || '', target.dataset.date || ''); return; }
  if (action === 'edit-schedule') { const schedule = state.data.schedules.find((item) => item.id === target.dataset.id); openScheduleModal(schedule); return; }
  if (action === 'open-shift') {
    const list = state.data.shifts.map((shift) => `<div class="request-row"><div class="person-copy"><strong>${esc(shift.name)}</strong><span>${esc(shift.startTime)}–${esc(shift.endTime)}</span></div><div class="request-actions"><button class="button button-sm" data-action="edit-shift" data-id="${esc(shift.id)}">Edit</button>${shift.status === 'ACTIVE' ? `<button class="button button-sm button-danger" data-action="deactivate-shift" data-id="${esc(shift.id)}">Deactivate</button>` : statusBadge(shift.status)}</div></div>`).join('');
    showModal(`<div class="modal-backdrop" data-action="dismiss-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Manage shifts</h2><p>Create the work periods available for scheduling.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${ico('close', true)}</button></div><div class="modal-body"><div class="request-list">${list}</div><div class="modal-actions"><button class="button" data-action="close-modal">Done</button><button class="button button-primary" data-action="create-shift">${ico('plus', true)}Add shift</button></div></div></section></div>`); return;
  }
  if (action === 'create-shift') { openShiftModal(); return; }
  if (action === 'edit-shift') { openShiftModal(state.data.shifts.find((item) => item.id === target.dataset.id)); return; }
  if (action === 'deactivate-shift') { const item = state.data.shifts.find((entry) => entry.id === target.dataset.id); openConfirm('Deactivate shift?', `${item.name} can no longer be assigned. Existing scheduled shifts remain on the calendar.`, 'confirm-deactivate-shift', item.id); return; }
  if (action === 'confirm-deactivate-shift') {
    try { await api(`/api/shifts/${encodeURIComponent(target.dataset.id)}`, { method: 'DELETE' }); await afterMutation('Shift deactivated.'); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'open-leave-type') {
    const list = state.data.leaveTypes.map((type) => `<div class="request-row"><div class="person-copy"><strong>${esc(type.name)}</strong><span>Balance: ${esc(type.balanceField.replace('Balance', ''))}</span></div><div class="request-actions"><button class="button button-sm" data-action="edit-leave-type" data-id="${esc(type.id)}">Edit</button>${type.id.startsWith('leave-') ? '' : `<button class="button button-sm button-danger" data-action="deactivate-leave-type" data-id="${esc(type.id)}">Deactivate</button>`}</div></div>`).join('');
    showModal(`<div class="modal-backdrop" data-action="dismiss-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Leave types</h2><p>Choose which balance each leave type uses.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${ico('close', true)}</button></div><div class="modal-body"><div class="request-list">${list}</div><div class="modal-actions"><button class="button" data-action="close-modal">Done</button><button class="button button-primary" data-action="create-leave-type">${ico('plus', true)}Add type</button></div></div></section></div>`); return;
  }
  if (action === 'create-leave-type') { openLeaveTypeModal(); return; }
  if (action === 'edit-leave-type') { openLeaveTypeModal(state.data.leaveTypes.find((item) => item.id === target.dataset.id)); return; }
  if (action === 'deactivate-leave-type') { const item = state.data.leaveTypes.find((entry) => entry.id === target.dataset.id); openConfirm('Deactivate leave type?', `${item.name} will no longer be available for new requests. Historical requests will remain.`, 'confirm-deactivate-leave-type', item.id); return; }
  if (action === 'confirm-deactivate-leave-type') {
    try { await api(`/api/leave-types/${encodeURIComponent(target.dataset.id)}`, { method: 'DELETE' }); await afterMutation('Leave type deactivated.'); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'schedule-delete') {
    const schedule = state.data.schedules.find((item) => item.id === target.dataset.id);
    openConfirm('Remove this shift?', `The assignment on ${dateLabel(schedule.workDate, { day: 'numeric', month: 'long', year: 'numeric' })} will be removed from the employee’s upcoming schedule.`, 'confirm-delete-schedule', schedule.id); return;
  }
  if (action === 'confirm-delete-schedule') {
    try { await api(`/api/schedules/${encodeURIComponent(target.dataset.id)}`, { method: 'DELETE' }); await afterMutation('Shift removed and employee notified.'); }
    catch (error) { closeModal(); toast(error.message, true); }
    return;
  }
  if (action === 'week-prev') { state.weekOffset -= 1; render(); return; }
  if (action === 'week-next') { state.weekOffset += 1; render(); return; }
  if (action === 'read-all') {
    try { await api('/api/notifications/read-all', { method: 'POST', body: {} }); await refresh(); toast('All notifications marked as read.'); }
    catch (error) { toast(error.message, true); }
  }
}

function render() {
  if (!state.data) { loginView(); return; }
  shell();
  const search = document.querySelector('#people-search');
  if (search) {
    search.addEventListener('input', (event) => {
      const cursor = event.target.selectionStart;
      state.search = event.target.value;
      const main = document.querySelector('#main-content');
      main.innerHTML = pageContent();
      const nextSearch = document.querySelector('#people-search');
      nextSearch?.focus(); nextSearch?.setSelectionRange(cursor, cursor);
      nextSearch?.addEventListener('input', (nextEvent) => { state.search = nextEvent.target.value; renderPeopleBody(); });
      bindFilters();
    });
  }
  bindFilters();
}

function renderPeopleBody() {
  const main = document.querySelector('#main-content');
  if (main && state.page === 'people') {
    const cursor = document.querySelector('#people-search')?.selectionStart;
    main.innerHTML = pageContent();
    const input = document.querySelector('#people-search');
    input?.focus();
    if (cursor !== undefined) input?.setSelectionRange(cursor, cursor);
    input?.addEventListener('input', (event) => { state.search = event.target.value; renderPeopleBody(); });
    bindFilters();
  }
}
function bindFilters() {
  document.querySelector('#department-filter')?.addEventListener('change', (event) => { state.departmentFilter = event.target.value; render(); });
  document.querySelector('#position-filter')?.addEventListener('change', (event) => { state.positionFilter = event.target.value; render(); });
  document.querySelector('#schedule-department-filter')?.addEventListener('change', (event) => { state.departmentFilter = event.target.value; render(); });
  document.querySelector('#employee-status-filter')?.addEventListener('change', (event) => { state.employeeStatusFilter = event.target.value; render(); });
  document.querySelector('#schedule-shift-filter')?.addEventListener('change', (event) => { state.scheduleShiftFilter = event.target.value; render(); });
  document.querySelector('#schedule-search')?.addEventListener('input', (event) => {
    const cursor = event.target.selectionStart;
    state.scheduleSearch = event.target.value;
    render();
    const input = document.querySelector('#schedule-search');
    input?.focus(); input?.setSelectionRange(cursor, cursor);
  });
}

async function signIn(form) {
  const data = readForm(form);
  const result = await api('/api/auth/login', { method: 'POST', body: { email: data.identity, password: data.password } });
  state.token = result.token;
  sessionStorage.setItem('hrflow_token', result.token);
  state.page = 'dashboard';
  state.weekOffset = 0;
  state.search = '';
  await refresh();
}
function signOut(showToast = false) {
  if (showToast && state.token) api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {});
  state.token = null;
  state.data = null;
  sessionStorage.removeItem('hrflow_token');
  state.modal = null;
  loginView();
  if (showToast) toast('You are signed out.');
}

app.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  if (target.dataset.action === 'dismiss-modal' && target !== event.target) return;
  try { await clickAction(target); }
  catch (error) { toast(error.message, true); }
});
document.addEventListener('keydown', (event) => {
  if (!state.modal) return;
  if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('.modal');
  const focusable = [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
});
app.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id === 'login-form') {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try { await signIn(form); }
    catch (error) { form.querySelector('.login-error').textContent = error.message; button.disabled = false; }
    return;
  }
  if (form.matches('[data-form]')) {
    event.preventDefault();
    await submitForm(form);
  }
});

if (state.token) {
  app.innerHTML = '<main class="startup-state" role="status">Loading your HRFlow workspace…</main>';
  refresh().catch(() => {
    signOut(false);
    loginView('We could not restore your saved session. Sign in again, or refresh this page if the issue continues.');
  });
} else {
  loginView();
}
