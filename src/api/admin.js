import client from './client'

export const listUsers = () => client.get('/admin/users').then(r => r.data)

export const listCompanies = () => client.get('/admin/companies').then(r => r.data)

export const createUser = (data) => client.post('/admin/users', data).then(r => r.data)

export const updateUser = (userId, data) =>
  client.patch(`/admin/users/${userId}`, data).then(r => r.data)

export const batchFutureAccess = (userIds, enabled) =>
  client.post('/admin/users/batch-future-access', { user_ids: userIds, enabled }).then(r => r.data)

export const listInviteTokens = () =>
  client.get('/admin/invite-tokens').then(r => r.data)

export const generateInviteToken = (company_name) =>
  client.post('/admin/invite-tokens', { company_name }).then(r => r.data)
