# Backend Spec — Reporting & Reminder Endpoints

This document describes the three new API endpoints and the Friday cron job required for the Admin Reports feature on the frontend (`feature/admin-reports` branch).

---

## 1. Weekly Report

**Route**
```
GET /api/v1/admin/reports/weekly
```

**Auth:** Bearer token — admin or superuser only

**Query params**
| Param | Type | Example | Required |
|---|---|---|---|
| `week_start` | date string | `2026-05-04` | Yes — must be a Monday |

**Logic**
- Fetch all users scoped to the calling admin's company (same scoping as `GET /admin/users`)
- For each user, fetch their time entries for Mon–Fri of that week
- For each user, fetch their submission status for that week
- Return aggregated data

**Response**
```json
{
  "week_start": "2026-05-04",
  "week_end": "2026-05-08",
  "employees": [
    {
      "id": "uuid",
      "name": "Sateesh Biyyala",
      "email": "sateesh@fourhubtech.com",
      "days": {
        "monday": 480,
        "tuesday": 480,
        "wednesday": 450,
        "thursday": 480,
        "friday": 480
      },
      "total_minutes": 2370,
      "submitted": true,
      "submitted_at": "2026-05-08T17:30:00Z"
    }
  ]
}
```

- `days.*` values are **net worked minutes** for that day (null or omit key if no entry for that day)
- `total_minutes` is sum of all day net minutes
- `submitted` is true if the employee submitted this week
- `submitted_at` is ISO 8601 UTC string, null if not submitted

---

## 2. Monthly Report

**Route**
```
GET /api/v1/admin/reports/monthly
```

**Auth:** Bearer token — admin or superuser only

**Query params**
| Param | Type | Example | Required |
|---|---|---|---|
| `year` | integer | `2026` | Yes |
| `month` | integer | `5` | Yes (1–12) |

**Logic**
- Calculate the Mon–Fri working weeks whose **Monday falls within the given month**
  - Example for May 2026: Mon 4 May, Mon 11 May, Mon 18 May, Mon 25 May → 4 weeks
- For each week, fetch net worked minutes per employee (same as weekly report per week)
- Sum per employee across all weeks for monthly total
- Sum across all employees per week and overall for company totals

**Response**
```json
{
  "year": 2026,
  "month": 5,
  "month_name": "May",
  "weeks": [
    { "label": "Week 1", "week_start": "2026-05-04", "week_end": "2026-05-08" },
    { "label": "Week 2", "week_start": "2026-05-11", "week_end": "2026-05-15" },
    { "label": "Week 3", "week_start": "2026-05-18", "week_end": "2026-05-22" },
    { "label": "Week 4", "week_start": "2026-05-25", "week_end": "2026-05-29" }
  ],
  "employees": [
    {
      "id": "uuid",
      "name": "Sateesh Biyyala",
      "email": "sateesh@fourhubtech.com",
      "week_minutes": [2400, 2400, 2280, 2400],
      "total_minutes": 9480
    }
  ],
  "company_week_minutes": [4800, 4800, 4560, 4800],
  "company_total_minutes": 18960
}
```

- `week_minutes` array index matches `weeks` array index (same length, same order)
- `company_week_minutes` is the sum of all employees' minutes for each week
- `company_total_minutes` is the sum of `company_week_minutes`

---

## 3. Send Reminder Email

**Route**
```
POST /api/v1/admin/reports/send-reminder
```

**Auth:** Bearer token — admin or superuser only

**Request body**
```json
{
  "week_start": "2026-05-04",
  "user_ids": ["uuid-1", "uuid-2"]
}
```

- `user_ids` — list of employee UUIDs to remind. Must belong to calling admin's company.

**Logic**
- For each user ID, send an email to their registered email address
- Use the email template below

**Response**
```json
{
  "sent": 2,
  "recipients": ["jane@company.com", "bob@company.com"]
}
```

**Email template**

```
Subject: Reminder: Please submit your timesheet for this week

Hi {employee_first_name},

This is a friendly reminder that your timesheet for the week of {week_start_formatted}
has not yet been submitted.

Please log in and submit your timesheet before end of day Friday:
https://timekeepinghub.com/#/dashboard

If you have already submitted, please ignore this message.

Thanks,
{company_name} Admin Team
```

---

## 4. Automated Friday 8 PM Reminder Cron Job

**Schedule:** Every Friday at 20:00 UTC

**Logic**
1. Fetch all companies
2. For each company, fetch all active employees
3. For the current week (Mon–Fri), check each employee's submission status
4. If not submitted → send reminder email using the same template as endpoint 3
5. Log how many reminders were sent per company

**Cron expression**
```
0 20 * * 5
```

> If your app server is in a different timezone, adjust accordingly. 20:00 UTC = 8 PM UTC. If your employees are in IST (+5:30), 8 PM IST = 14:30 UTC, so use `30 14 * * 5` for IST.

**Implementation note:** Use the same email-sending logic as the manual send-reminder endpoint — avoid code duplication by extracting into a shared function.

---

## Summary of changes needed in the backend

| Item | Type | Route |
|---|---|---|
| Weekly report | New endpoint | `GET /api/v1/admin/reports/weekly` |
| Monthly report | New endpoint | `GET /api/v1/admin/reports/monthly` |
| Send reminder (manual) | New endpoint | `POST /api/v1/admin/reports/send-reminder` |
| Friday auto-reminder | New cron job | Runs every Friday at 20:00 UTC |

All three endpoints follow the same auth pattern as existing `/api/v1/admin/` endpoints (company-scoped for company admins, all companies for superusers).
