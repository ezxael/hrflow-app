const crypto = require('node:crypto');
const passwordHash = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
function initialData() {
  const salt = 'hrflow-demo-salt-v1';
  const now = new Date().toISOString();
  const employees = [
    ['emp-001', 'maya', 'Maya', 'Pratama', 'maya@hrflow.local', 'People Operations', 'HR Administrator', 'ADMIN', 14],
    ['emp-002', 'daniel', 'Daniel', 'Santoso', 'daniel@hrflow.local', 'Engineering', 'Product Designer', 'EMPLOYEE', 12],
    ['emp-003', 'sarah', 'Sarah', 'Wijaya', 'sarah@hrflow.local', 'Engineering', 'Software Engineer', 'EMPLOYEE', 9],
    ['emp-004', 'ravi', 'Ravi', 'Kurniawan', 'ravi@hrflow.local', 'Finance', 'Finance Associate', 'EMPLOYEE', 11],
    ['emp-005', 'nadia', 'Nadia', 'Putri', 'nadia@hrflow.local', 'People Operations', 'HR Associate', 'EMPLOYEE', 10],
    ['emp-006', 'arif', 'Arif', 'Rahman', 'arif@hrflow.local', 'Operations', 'Operations Lead', 'EMPLOYEE', 8],
    ['emp-007', 'lina', 'Lina', 'Mahendra', 'lina@hrflow.local', 'Finance', 'Finance Manager', 'EMPLOYEE', 15],
  ].map(([id, username, firstName, lastName, email, department, position, role, annual], index) => ({
    id, username, firstName, lastName, email, phone: `+62 812 555 01${String(index + 10).slice(-2)}`,
    department, position, role, status: 'ACTIVE', hireDate: `202${index + 1}-0${(index % 8) + 1}-15`,
    annualBalance: annual, sickBalance: username === 'ravi' ? 7 : 8, personalBalance: 3, salt,
    passwordHash: passwordHash(username === 'maya' ? 'Admin123!' : username === 'daniel' ? 'Employee123!' : 'Welcome123!', salt),
    createdAt: now,
  }));
  const shifts = [
    { id: 'shift-1', name: 'Office hours', startTime: '09:00', endTime: '17:00', status: 'ACTIVE' },
    { id: 'shift-2', name: 'Early shift', startTime: '07:00', endTime: '15:00', status: 'ACTIVE' },
    { id: 'shift-3', name: 'Late shift', startTime: '13:00', endTime: '21:00', status: 'ACTIVE' },
  ];
  const dateFromToday = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  return {
    users: employees.map(({ id, username, email, role, status, salt, passwordHash }) => ({ id: `user-${id}`, employeeId: id, username, email, role, status, salt, passwordHash, sessionVersion: 0 })),
    employees,
    departments: ['People Operations', 'Engineering', 'Finance', 'Operations'].map((name) => ({ id: `dept-${name.toLowerCase().replaceAll(' ', '-')}`, name, status: 'ACTIVE' })),
    positions: ['HR Administrator', 'HR Associate', 'Product Designer', 'Software Engineer', 'Finance Associate', 'Finance Manager', 'Operations Lead'].map((name) => ({ id: `pos-${name.toLowerCase().replaceAll(' ', '-')}`, name, status: 'ACTIVE' })),
    leaveTypes: [
      { id: 'leave-annual', name: 'Annual leave', balanceField: 'annualBalance', status: 'ACTIVE' },
      { id: 'leave-sick', name: 'Sick leave', balanceField: 'sickBalance', status: 'ACTIVE' },
      { id: 'leave-personal', name: 'Personal leave', balanceField: 'personalBalance', status: 'ACTIVE' },
    ],
    shifts,
    leaveRequests: [
      { id: 'leave-request-1', employeeId: 'emp-002', leaveTypeId: 'leave-annual', startDate: dateFromToday(4), endDate: dateFromToday(5), days: 2, reason: 'Family visit', status: 'PENDING', submittedAt: now },
      { id: 'leave-request-2', employeeId: 'emp-004', leaveTypeId: 'leave-sick', startDate: dateFromToday(-8), endDate: dateFromToday(-8), days: 1, reason: 'Medical appointment', status: 'APPROVED', submittedAt: now, reviewedAt: now, reviewedBy: 'user-emp-001' },
      { id: 'leave-request-3', employeeId: 'emp-005', leaveTypeId: 'leave-annual', startDate: dateFromToday(-18), endDate: dateFromToday(-16), days: 3, reason: 'Personal travel', status: 'REJECTED', rejectionReason: 'Please choose dates after the release week.', submittedAt: now, reviewedAt: now, reviewedBy: 'user-emp-001' },
      { id: 'leave-request-4', employeeId: 'emp-006', leaveTypeId: 'leave-personal', startDate: dateFromToday(7), endDate: dateFromToday(7), days: 1, reason: 'Personal appointment', status: 'PENDING', submittedAt: now },
    ],
    schedules: [
      { id: 'schedule-1', employeeId: 'emp-002', shiftId: 'shift-1', workDate: dateFromToday(0), status: 'ACTIVE', createdAt: now },
      { id: 'schedule-2', employeeId: 'emp-003', shiftId: 'shift-2', workDate: dateFromToday(0), status: 'ACTIVE', createdAt: now },
      { id: 'schedule-3', employeeId: 'emp-002', shiftId: 'shift-3', workDate: dateFromToday(2), status: 'ACTIVE', createdAt: now },
      { id: 'schedule-4', employeeId: 'emp-004', shiftId: 'shift-1', workDate: dateFromToday(1), status: 'ACTIVE', createdAt: now },
      { id: 'schedule-5', employeeId: 'emp-005', shiftId: 'shift-2', workDate: dateFromToday(3), status: 'ACTIVE', createdAt: now },
      { id: 'schedule-6', employeeId: 'emp-006', shiftId: 'shift-1', workDate: dateFromToday(5), status: 'ACTIVE', createdAt: now },
    ],
    notifications: [
      { id: 'notif-admin-1', userId: 'user-emp-001', type: 'leave', title: 'Leave request needs review', message: 'Daniel Santoso requested annual leave.', createdAt: now, isRead: false },
      { id: 'notif-employee-1', userId: 'user-emp-002', type: 'schedule', title: 'Your schedule is ready', message: 'You are scheduled for Office hours today, 09:00–17:00.', createdAt: now, isRead: false },
    ],
  };
}
module.exports = { initialData };
