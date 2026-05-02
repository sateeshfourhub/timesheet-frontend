import client from './client'

export const getWeekEntries = (startDate, endDate) =>
  client.get('/time-entries/', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data)

export const createEntry = (data) =>
  client.post('/time-entries/manual', data).then(r => r.data)

export const updateEntry = (id, data) =>
  client.patch(`/time-entries/${id}`, data).then(r => r.data)

export const deleteEntry = (id) =>
  client.delete(`/time-entries/${id}`)

export const submitWeek = (startDate, endDate) =>
  client.post('/timesheets/submit', {}, {
    params: { start_date: startDate, end_date: endDate },
  }).then(r => r.data)

export const getSubmissionStatus = (weekStart) =>
  client.get('/timesheets/submission-status', {
    params: { week_start: weekStart },
  }).then(r => r.data)

export const getSubmissionStatusForUser = (userId, weekStart) =>
  client.get('/timesheets/submission-status', {
    params: { user_id: userId, week_start: weekStart },
  }).then(r => r.data)

export const unlockSubmission = (userId, weekStart) =>
  client.delete('/timesheets/submission', {
    params: { user_id: userId, week_start: weekStart },
  })
