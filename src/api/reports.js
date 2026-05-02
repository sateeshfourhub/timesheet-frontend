import client from './client'

export const getWeeklyReport = (weekStart) =>
  client.get('/admin/reports/weekly', { params: { week_start: weekStart } }).then(r => r.data)

export const getMonthlyReport = (year, month) =>
  client.get('/admin/reports/monthly', { params: { year, month } }).then(r => r.data)

export const sendReminder = (weekStart, userIds) =>
  client.post('/admin/reports/send-reminder', { week_start: weekStart, user_ids: userIds }).then(r => r.data)
