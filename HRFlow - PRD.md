# **HRFlow**

## **Product Requirements Document**

**Product type:** Web-based Human Resource Management System  
**Target environment:** Corporate office  
**Primary users:** Admin and Employee  
**Project type:** Undergraduate Project  
**Definition of done:** Working prototype, user-tested, and passed black-box testing

---

# **1\. Problem Statement**

## **1.1 Problem**

Corporate offices manage employee information, leave requests, and work schedules.

Many small and medium organizations still manage these processes through spreadsheets, messaging applications, email, or separate systems.

This creates several problems:

* Employee information becomes difficult to maintain.  
* Leave requests require manual communication.  
* Employees cannot easily track request status.  
* Admins must check leave requests manually.  
* Leave balances can become inaccurate.  
* Work schedules require manual allocation.  
* Schedule conflicts can occur.  
* Employees may miss schedule changes.  
* Managers or HR staff lack a single source of employee data.  
* Historical records become difficult to track.

HRFlow addresses these problems through one web application.

## **1.2 Product Solution**

HRFlow provides a centralized system for:

1. Employee data management.  
2. Leave request management.  
3. Leave approval workflows.  
4. Work schedule allocation.  
5. Shift management.  
6. Schedule conflict detection.  
7. Notifications.  
8. Role-based access.

The system gives Admin users management tools.

The system gives Employee users self-service tools.

---

# **2\. Target Users and Personas**

## **2.1 Target Users**

### **Admin**

The Admin manages HRFlow.

The Admin can:

* Manage employees.  
* Manage departments.  
* Manage positions.  
* Manage leave types.  
* Manage shifts.  
* Review leave requests.  
* Approve or reject leave requests.  
* Create employee schedules.  
* View employee schedules.  
* View system information.  
* Receive system notifications.

### **Employee**

The Employee uses HRFlow for personal HR tasks.

The Employee can:

* View personal information.  
* Submit leave requests.  
* View leave balances.  
* View leave history.  
* View work schedules.  
* Receive notifications.  
* View request status.

---

## **2.2 Persona 1 — HR Administrator**

**Name:** Maya  
**Role:** HR Administrator  
**Organization:** Corporate office  
**Technical ability:** Moderate

### **Background**

Maya manages employee records for a corporate office.

She also handles leave requests and employee schedules.

She currently spends time checking spreadsheets and messages.

### **Goals**

* Maintain accurate employee records.  
* Process leave requests quickly.  
* Allocate work schedules efficiently.  
* Avoid scheduling conflicts.  
* Keep HR records centralized.

### **Pain points**

* Employee information exists in multiple places.  
* Leave requests arrive through different channels.  
* Manual schedule allocation takes time.  
* Previous requests are difficult to find.  
* Schedule conflicts are easy to miss.

### **HRFlow needs**

Maya needs a dashboard.

She needs employee management.

She needs leave approval.

She needs schedule management.

She needs clear system notifications.

---

## **2.3 Persona 2 — Corporate Employee**

**Name:** Daniel  
**Role:** Employee  
**Organization:** Corporate office  
**Technical ability:** Basic to moderate

### **Background**

Daniel works regular office shifts.

He needs to request leave and check his work schedule.

He wants to complete these tasks without contacting HR for every update.

### **Goals**

* Submit leave requests easily.  
* Know remaining leave days.  
* Track request status.  
* Check upcoming work schedules.  
* Receive important updates.

### **Pain points**

* He does not always know whether a request was processed.  
* He may need to ask HR about his remaining leave.  
* Schedule changes may be difficult to track.  
* Previous leave records are not always accessible.

### **HRFlow needs**

Daniel needs a simple dashboard.

He needs a leave request form.

He needs leave history.

He needs a schedule calendar.

He needs notifications.

---

# **3\. Goals and Non-Goals**

## **3.1 Product Goals**

### **Goal 1 — Centralize employee information**

HRFlow should provide one location for employee data.

### **Goal 2 — Digitize leave management**

Employees should submit leave requests through HRFlow.

Admins should process requests through HRFlow.

### **Goal 3 — Improve leave tracking**

Employees should see:

* Remaining leave.  
* Submitted requests.  
* Request status.  
* Leave history.

### **Goal 4 — Simplify schedule allocation**

Admins should create shifts and assign employees.

Employees should view their schedules.

### **Goal 5 — Reduce scheduling errors**

HRFlow should detect overlapping schedules before assignment.

### **Goal 6 — Provide role-based access**

Employees should access only permitted employee functions.

Admins should access management functions.

### **Goal 7 — Produce a testable thesis prototype**

The application should run in a real web environment.

The application should support user testing.

The application should support black-box testing.

---

## **3.2 Non-Goals**

The MVP will not attempt to become a complete enterprise HR platform.

The following features are outside the MVP unless later approved:

* Payroll processing.  
* Tax calculation.  
* Employee recruitment.  
* Performance management.  
* Applicant tracking.  
* Expense management.  
* Employee benefits management.  
* Biometric attendance.  
* Facial recognition.  
* GPS attendance tracking.  
* Native Android application.  
* Native iOS application.  
* Complex organizational hierarchy.  
* AI-based HR recommendations.

These features may become future versions.

---

# **4\. User Stories**

## **4.1 Authentication**

* As an **Employee**, I want to log in so that I can securely access my HR information.  
* As an **Admin**, I want to log in so that I can manage HRFlow.  
* As a **user**, I want to log out so that other people cannot access my account.

## **4.2 Employee Management**

* As an **Admin**, I want to create employee records so that employees can use HRFlow.  
* As an **Admin**, I want to edit employee records so that information remains accurate.  
* As an **Admin**, I want to deactivate employee accounts so that former employees cannot access the system.  
* As an **Admin**, I want to search employees so that I can find records quickly.  
* As an **Admin**, I want to filter employees so that I can organize employee information.  
* As an **Employee**, I want to view my profile so that I can check my personal information.

## **4.3 Leave Management**

* As an **Employee**, I want to submit a leave request so that I can request time away from work.  
* As an **Employee**, I want to select a leave type so that my request has the correct category.  
* As an **Employee**, I want to view my leave balance so that I know how much leave remains.  
* As an **Employee**, I want to view leave history so that I can track previous requests.  
* As an **Employee**, I want to view request status so that I know whether my request was processed.  
* As an **Admin**, I want to view pending leave requests so that I can process them.  
* As an **Admin**, I want to approve a leave request so that the employee receives approved leave.  
* As an **Admin**, I want to reject a leave request so that invalid requests are not granted.  
* As an **Admin**, I want to provide a rejection reason so that the employee understands the decision.

## **4.4 Work Scheduling**

* As an **Admin**, I want to create shifts so that work periods can be defined.  
* As an **Admin**, I want to assign employees to shifts so that work schedules are organized.  
* As an **Admin**, I want to detect schedule conflicts so that employees are not assigned overlapping shifts.  
* As an **Employee**, I want to view my work schedule so that I know when I need to work.  
* As an **Employee**, I want to view my schedule in a calendar so that upcoming work is easy to understand.

## **4.5 Notifications**

* As an **Employee**, I want to receive a notification after submitting leave so that I know the request was recorded.  
* As an **Employee**, I want to receive a notification after approval or rejection so that I know the decision.  
* As an **Employee**, I want to receive schedule notifications so that I know when my schedule changes.  
* As an **Admin**, I want to receive notifications about pending requests so that I can process them.

---

# **5\. Feature List**

## **5.1 MVP**

The MVP must contain:

### **Authentication and Access**

* Login.  
* Logout.  
* Role-based access.  
* Admin role.  
* Employee role.

### **Employee Management**

* Employee profiles.  
* Employee directory.  
* Employee creation.  
* Employee editing.  
* Employee deactivation.  
* Employee search.  
* Employee filtering.  
* Department management.  
* Position management.

### **Leave Management**

* Leave types.  
* Leave request creation.  
* Leave request validation.  
* Leave approval.  
* Leave rejection.  
* Rejection reason.  
* Leave balance.  
* Leave history.  
* Leave status.

### **Work Scheduling**

* Shift creation.  
* Shift editing.  
* Shift deletion or deactivation.  
* Schedule allocation.  
* Schedule calendar.  
* Schedule conflict detection.  
* Employee schedule view.

### **Dashboard**

* Admin dashboard.  
* Employee dashboard.  
* Pending leave count.  
* Upcoming schedule information.  
* Leave balance information.

### **Notifications**

* Leave submission notification.  
* Leave approval notification.  
* Leave rejection notification.  
* Schedule assignment notification.

---

## **5.2 V2**

The following features can be added after the MVP:

* Attendance tracking.  
* Check-in and check-out.  
* Schedule templates.  
* Recurring schedules.  
* Export to CSV.  
* Export to PDF.  
* Advanced dashboard analytics.  
* Audit logs.  
* Bulk employee import.  
* Bulk schedule allocation.  
* Employee self-service profile editing.  
* Email notifications.

---

## **5.3 Future**

Potential future features include:

* Payroll integration.  
* Recruitment management.  
* Performance management.  
* Mobile application.  
* Biometric attendance.  
* GPS-based attendance.  
* Advanced workforce analytics.  
* Multi-company support.  
* Multi-branch support.  
* Integration with external HR systems.  
* AI-assisted schedule optimization.

---

# **6\. Detailed Functional Requirements**

# **6.1 Authentication**

### **FR-AUTH-01 — Login**

The system must provide a login page.

The user must enter:

* Email or username.  
* Password.

The system must validate the credentials.

The system must reject invalid credentials.

The system must redirect users to the correct dashboard after successful login.

### **FR-AUTH-02 — Role-based access**

The system must identify the user's role.

The system must support:

* Admin.  
* Employee.

The system must restrict unauthorized pages.

An Employee must not access Admin management functions.

### **FR-AUTH-03 — Logout**

The system must provide logout functionality.

Logout must invalidate the active session.

The user must return to the login page.

---

# **6.2 Employee Management**

### **FR-EMP-01 — Create employee**

Admin must be able to create an employee.

The form should contain the required employee information.

The system must validate required fields.

The system must prevent duplicate employee identifiers.

### **FR-EMP-02 — View employee**

Admin must be able to view employee information.

The system should display:

* Employee ID.  
* Full name.  
* Email.  
* Phone number.  
* Department.  
* Position.  
* Employment status.  
* Leave balance.

### **FR-EMP-03 — Edit employee**

Admin must be able to update employee information.

The system must validate updated information.

### **FR-EMP-04 — Deactivate employee**

Admin must be able to deactivate an employee.

Deactivation must prevent the employee from logging in.

Existing historical records must remain available.

### **FR-EMP-05 — Search employees**

Admin must be able to search employees.

Search should support at least employee name and employee ID.

### **FR-EMP-06 — Filter employees**

Admin must be able to filter employees by:

* Department.  
* Position.  
* Employment status.

---

# **6.3 Department Management**

### **FR-DEPT-01 — Create department**

Admin must be able to create a department.

### **FR-DEPT-02 — Edit department**

Admin must be able to edit a department.

### **FR-DEPT-03 — View department**

Admin must be able to view departments.

The system should show employees assigned to each department.

### **FR-DEPT-04 — Prevent invalid deletion**

The system must prevent deletion of a department that still has active employees unless reassignment occurs.

---

# **6.4 Position Management**

### **FR-POS-01 — Create position**

Admin must be able to create a position.

### **FR-POS-02 — Edit position**

Admin must be able to edit a position.

### **FR-POS-03 — Assign position**

Admin must be able to assign a position to an employee.

---

# **6.5 Leave Management**

### **FR-LEAVE-01 — Leave types**

Admin must be able to manage leave types.

Examples include:

* Annual leave.  
* Sick leave.  
* Personal leave.

The exact leave types remain an open question.

### **FR-LEAVE-02 — Leave request**

Employee must be able to submit a leave request.

The request must contain:

* Leave type.  
* Start date.  
* End date.  
* Reason.  
* Request status.

### **FR-LEAVE-03 — Date validation**

The system must reject:

* Missing dates.  
* End dates before start dates.  
* Invalid date ranges.

### **FR-LEAVE-04 — Leave balance validation**

The system must check available leave balance before accepting a request.

The system must prevent requests that exceed the available balance.

### **FR-LEAVE-05 — Overlapping leave validation**

The system must detect overlapping approved or pending leave requests.

The system must prevent duplicate overlapping requests unless the business rule allows them.

### **FR-LEAVE-06 — Leave approval**

Admin must be able to approve pending requests.

The system must change the request status to Approved.

The system must update the employee's leave balance.

### **FR-LEAVE-07 — Leave rejection**

Admin must be able to reject pending requests.

The system must change the request status to Rejected.

Admin should provide a rejection reason.

The rejection reason should be visible to the employee.

### **FR-LEAVE-08 — Leave history**

Employee must be able to view previous requests.

Each request should display:

* Leave type.  
* Dates.  
* Reason.  
* Status.  
* Submission date.  
* Decision date.  
* Rejection reason, if applicable.

### **FR-LEAVE-09 — Leave cancellation**

The requirement for employee cancellation of pending requests is an open question.

---

# **6.6 Work Scheduling**

### **FR-SCH-01 — Create shift**

Admin must be able to create a shift.

A shift should contain:

* Shift name.  
* Start time.  
* End time.  
* Status.

### **FR-SCH-02 — Assign schedule**

Admin must be able to assign a shift to an employee.

The assignment must contain:

* Employee.  
* Date.  
* Shift.

### **FR-SCH-03 — Schedule conflict detection**

Before saving an assignment, the system must check existing schedules.

The system must identify overlapping schedules for the same employee.

The system must prevent conflicting assignments.

### **FR-SCH-04 — Schedule calendar**

Employee must be able to view scheduled work in calendar format.

The calendar should show:

* Date.  
* Shift.  
* Start time.  
* End time.

### **FR-SCH-05 — Admin schedule view**

Admin must be able to view schedules across employees.

The Admin should be able to filter schedules by:

* Employee.  
* Department.  
* Date.  
* Shift.

### **FR-SCH-06 — Schedule modification**

Admin must be able to modify an existing schedule.

The system must re-check conflicts after modification.

### **FR-SCH-07 — Schedule removal**

Admin must be able to remove or deactivate a schedule.

The exact behavior remains an open question.

---

# **6.7 Dashboard**

## **Admin Dashboard**

The Admin dashboard should display:

* Total active employees.  
* Pending leave requests.  
* Employees currently on leave.  
* Upcoming schedules.  
* Recent activity.

## **Employee Dashboard**

The Employee dashboard should display:

* Current leave balance.  
* Pending leave requests.  
* Recent leave requests.  
* Upcoming work schedules.  
* Recent notifications.

Exact dashboard metrics remain an open question.

---

# **6.8 Notifications**

### **FR-NOTIF-01 — Notification creation**

The system must create notifications after important events.

Examples:

* Leave submitted.  
* Leave approved.  
* Leave rejected.  
* Schedule assigned.  
* Schedule changed.

### **FR-NOTIF-02 — Notification display**

Users must be able to view notifications inside HRFlow.

### **FR-NOTIF-03 — Read status**

Users should be able to identify unread notifications.

The requirement for marking notifications as read is an open question.

### **FR-NOTIF-04 — Notification delivery**

The MVP should support in-app notifications.

Email notifications are not required for the MVP unless later approved.

---

# **7\. Data Model Sketch**

The following model represents the initial database structure.

## **7.1 User**

**Purpose:** Stores authentication information.

Key fields:

* user\_id  
* employee\_id  
* email  
* password\_hash  
* role  
* status  
* created\_at  
* updated\_at

Possible roles:

* ADMIN  
* EMPLOYEE

---

## **7.2 Employee**

**Purpose:** Stores employee information.

Key fields:

* employee\_id  
* user\_id  
* employee\_number  
* first\_name  
* last\_name  
* email  
* phone  
* department\_id  
* position\_id  
* employment\_status  
* hire\_date  
* created\_at  
* updated\_at

---

## **7.3 Department**

**Purpose:** Stores organizational departments.

Key fields:

* department\_id  
* name  
* description  
* status  
* created\_at  
* updated\_at

---

## **7.4 Position**

**Purpose:** Stores employee positions.

Key fields:

* position\_id  
* name  
* description  
* status  
* created\_at  
* updated\_at

---

## **7.5 LeaveType**

**Purpose:** Defines available leave categories.

Key fields:

* leave\_type\_id  
* name  
* description  
* default\_balance  
* status  
* created\_at  
* updated\_at

---

## **7.6 LeaveBalance**

**Purpose:** Stores an employee's available leave.

Key fields:

* leave\_balance\_id  
* employee\_id  
* leave\_type\_id  
* total\_days  
* used\_days  
* remaining\_days  
* year  
* updated\_at

---

## **7.7 LeaveRequest**

**Purpose:** Stores employee leave requests.

Key fields:

* leave\_request\_id  
* employee\_id  
* leave\_type\_id  
* start\_date  
* end\_date  
* requested\_days  
* reason  
* status  
* rejection\_reason  
* submitted\_at  
* reviewed\_at  
* reviewed\_by

Possible statuses:

* PENDING  
* APPROVED  
* REJECTED  
* CANCELLED

---

## **7.8 Shift**

**Purpose:** Defines work shifts.

Key fields:

* shift\_id  
* name  
* start\_time  
* end\_time  
* status  
* created\_at  
* updated\_at

---

## **7.9 WorkSchedule**

**Purpose:** Stores employee schedule assignments.

Key fields:

* schedule\_id  
* employee\_id  
* shift\_id  
* work\_date  
* status  
* created\_at  
* updated\_at

---

## **7.10 Notification**

**Purpose:** Stores in-app notifications.

Key fields:

* notification\_id  
* user\_id  
* type  
* title  
* message  
* related\_entity\_id  
* is\_read  
* created\_at

---

## **7.11 Main Relationships**

The main relationships are:

* One User belongs to one Employee.  
* One Employee belongs to one Department.  
* One Employee belongs to one Position.  
* One Employee has many LeaveRequests.  
* One LeaveType has many LeaveRequests.  
* One Employee has many LeaveBalances.  
* One LeaveType has many LeaveBalances.  
* One Employee has many WorkSchedules.  
* One Shift has many WorkSchedules.  
* One User has many Notifications.

---

# **8\. Edge Cases and Failure States**

## **8.1 Authentication**

### **Invalid credentials**

**Expected behavior:**  
Show an error message.

Do not reveal whether the email or password was incorrect.

### **Inactive account**

**Expected behavior:**  
Prevent login.

Display an appropriate account-status message.

### **Unauthorized page access**

**Expected behavior:**  
Reject the request.

Redirect the user to an authorized page.

---

## **8.2 Employee Management**

### **Duplicate employee ID**

**Expected behavior:**  
Reject creation.

Display a validation message.

### **Duplicate email**

**Expected behavior:**  
Reject creation if the email must be unique.

The exact uniqueness rule is an open question.

### **Deactivating an employee with future schedules**

**Expected behavior:**  
The system must define whether future schedules are automatically removed, preserved, or flagged.

This is an open question.

---

## **8.3 Leave Management**

### **Leave request exceeds balance**

**Expected behavior:**  
Prevent submission.

Explain that the available balance is insufficient.

### **End date before start date**

**Expected behavior:**  
Prevent submission.

### **Leave request during existing approved leave**

**Expected behavior:**  
Prevent overlapping requests.

### **Admin approves an already rejected request**

**Expected behavior:**  
Prevent the action.

Only pending requests should be actionable.

### **Two Admins process the same request**

**Expected behavior:**  
The system should prevent inconsistent status changes.

The exact concurrency strategy is an open technical question.

### **Leave balance becomes negative**

**Expected behavior:**  
The system must prevent negative balances unless the organization's policy explicitly permits them.

---

## **8.4 Scheduling**

### **Overlapping shifts**

**Expected behavior:**  
Prevent the schedule assignment.

Show the conflicting schedule.

### **Employee has leave on scheduled date**

**Expected behavior:**  
The system should warn or prevent scheduling.

The exact business rule is an open question.

### **Shift crosses midnight**

Example:

`22:00–06:00`

**Expected behavior:**  
The system must correctly calculate the shift duration.

Support for overnight shifts is an open MVP requirement.

### **Schedule assignment to inactive employee**

**Expected behavior:**  
Prevent assignment.

### **Deleted shift with existing schedules**

**Expected behavior:**  
The system should not destroy historical schedule records.

The exact deletion behavior is an open question.

---

## **8.5 System Failure**

### **Database unavailable**

**Expected behavior:**  
Show a general error message.

Do not expose database details.

### **Network failure**

**Expected behavior:**  
Inform the user that the request failed.

The user should be able to retry.

### **Server error**

**Expected behavior:**  
Return a controlled error response.

Log technical details on the server.

Do not expose sensitive technical information to users.

### **Duplicate form submission**

**Expected behavior:**  
The system should avoid creating duplicate leave requests or schedules.

---

# **9\. Success Metrics**

Because HRFlow is a thesis prototype, success should focus on **functionality, usability, and testing results**.

## **9.1 Functional Success**

### **Black-box test pass rate**

**Target:** 100% of critical MVP test cases pass.

Critical test cases include:

* Login.  
* Role authorization.  
* Employee creation.  
* Employee editing.  
* Leave submission.  
* Leave approval.  
* Leave rejection.  
* Leave balance update.  
* Schedule creation.  
* Schedule assignment.  
* Conflict detection.  
* Schedule viewing.  
* Notifications.

---

## **9.2 User Testing**

### **Task completion rate**

Measure the percentage of test participants who successfully complete defined tasks.

Example tasks:

1. Log in.  
2. Find an employee.  
3. Submit leave.  
4. Approve leave.  
5. View leave status.  
6. Create a shift.  
7. Assign a schedule.  
8. View a schedule.

**Target:** At least 80% successful completion across defined user tasks.

The final target should be confirmed before testing.

---

## **9.3 Usability**

Measure user feedback after testing.

Possible measurements:

* Ease of navigation.  
* Ease of submitting leave.  
* Ease of checking schedules.  
* Ease of managing employees.  
* Overall satisfaction.

A standardized usability questionnaire such as SUS may be used.

The choice of usability instrument is an open question.

---

## **9.4 System Performance**

The MVP should provide reasonable response times for normal operations.

Measure:

* Login response.  
* Employee search response.  
* Leave submission response.  
* Leave approval response.  
* Schedule creation response.  
* Schedule calendar loading.

The exact performance threshold is an open question.

---

## **9.5 Data Accuracy**

The system should correctly:

* Calculate leave balances.  
* Store leave requests.  
* Update request status.  
* Detect schedule conflicts.  
* Display employee information.  
* Display schedules.

Target:

**100% correctness for tested business rules.**

---

# **10\. Open Questions**

The following questions must be resolved before final development requirements are frozen.

## **Business Rules**

1. **How many annual leave days does an employee receive?**  
2. **Does every leave type have a separate balance?**  
3. **Are leave balances reset every year?**  
4. **Can employees cancel pending leave requests?**  
5. **Can employees cancel approved leave?**  
6. **Can an Admin modify an approved leave request?**  
7. **Can an Admin override an insufficient leave balance?**  
8. **Can employees request leave on weekends or public holidays?**  
9. **Can an employee receive multiple schedules on the same day?**  
10. **Can an employee be scheduled while on approved leave?**  
11. **Should overnight shifts be supported in the MVP?**  
12. **Should Admin users be able to create multiple Admin accounts?**  
13. **Can one employee belong to multiple departments?**  
14. **Can an employee have multiple positions?**

## **Notifications**

15. **Should notifications be in-app only?**  
16. **Should the MVP send email notifications?**  
17. **Should notifications remain permanently available in notification history?**

## **Technical**

18. **Which database will HRFlow use?**  
19. **Which authentication method will HRFlow use?**  
20. **Will passwords use session-based authentication or token-based authentication?**  
21. **Which Node.js framework will be used?**  
22. **Will the frontend use server-rendered pages or a separate frontend framework?**  
23. **Which hosting and database providers will be used with Vercel?**  
24. **How will environment variables and secrets be managed?**  
25. **What backup strategy is required?**

## **Thesis Evaluation**

26. **How many participants will perform user testing?**  
27. **Who will participate in testing: Admin users, employees, or both?**  
28. **Which usability measurement will be used?**  
29. **How many black-box test cases are required?**  
30. **What minimum black-box pass rate will define success?**  
31. **What performance threshold will define acceptable system performance?**  
32. **Will the thesis evaluate usability, functionality, or both?**

---

# **MVP Definition of Done**

HRFlow is considered MVP-complete when all of the following conditions are met:

## **Functional**

* Admin can log in.  
* Employee can log in.  
* Role-based access works.  
* Admin can manage employee records.  
* Admin can manage departments.  
* Admin can manage positions.  
* Admin can manage leave types.  
* Employee can submit leave requests.  
* Admin can approve leave requests.  
* Admin can reject leave requests.  
* Employee can view leave status.  
* Employee can view leave history.  
* Employee can view leave balance.  
* Admin can create shifts.  
* Admin can assign shifts.  
* HRFlow detects schedule conflicts.  
* Employee can view work schedules.  
* HRFlow generates required notifications.

## **Technical**

* The application runs as a web application.  
* The application uses Node.js as the primary backend technology.  
* The application can be deployed to the chosen hosting environment.  
* Database operations work correctly.  
* Authentication works.  
* Authorization works.  
* Application errors are handled without exposing sensitive information.

## **Testing**

* All critical black-box test cases pass.  
* User testing has been completed.  
* User testing results have been documented.  
* Identified critical defects have been fixed.  
* The final prototype can be demonstrated to the thesis supervisor.

## **Thesis Deliverable**

The final HRFlow prototype should demonstrate one complete workflow for each core module:

**Employee Management**

`Admin → Create Employee → Employee Account → Employee Profile`

**Leave Management**

`Employee → Submit Leave → Admin → Approve/Reject → Employee → View Result`

**Work Scheduling**

`Admin → Create Shift → Assign Employee → Conflict Check → Employee → View Schedule`

These workflows form the core functional scope of HRFlow.

