import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data)

export const register = (data) =>
  client.post('/auth/register', data).then((r) => r.data)

export const employeeRegister = (data) =>
  client.post('/auth/employee-register', data).then((r) => r.data)

export const getMe = () =>
  client.get('/auth/me').then((r) => r.data)

export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email })

export const resetPassword = (token, new_password) =>
  client.post('/auth/reset-password', { token, new_password })
