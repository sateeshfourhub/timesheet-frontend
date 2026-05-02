import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL = 'http://localhost:5174'
const OUT   = path.join(__dirname, '../docs/screenshots')
fs.mkdirSync(OUT, { recursive: true })

const MOCK_USER = {
  id: 'mock-id',
  full_name: 'John Smith',
  email: 'john@acmecorp.com',
  role: 'admin',
  is_superuser: false,
  is_active: true,
  company_id: 'mock-company',
  company_name: 'Acme Corp',
  future_time_log_enabled: false,
}

const MOCK_ENTRIES = []
const MOCK_SUBMIT = { submitted: false }

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-web-security']
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

await page.setRequestInterception(true)
page.on('request', (req) => {
  const url = req.url()

  if (url.includes('/auth/me')) {
    req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
  } else if (url.includes('/time-entries') || url.includes('/timesheets/entries')) {
    req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ENTRIES) })
  } else if (url.includes('/timesheets/submission-status')) {
    req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SUBMIT) })
  } else if (url.includes('/auth/forgot-password')) {
    req.respond({ status: 204, contentType: 'application/json', body: '' })
  } else if (url.includes('/auth/reset-password')) {
    req.respond({ status: 204, contentType: 'application/json', body: '' })
  } else if (url.includes('/admin/users')) {
    req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: '1', full_name: 'Alice Johnson', email: 'alice@acmecorp.com', role: 'admin', is_superuser: false, is_active: true, future_time_log_enabled: false, company_name: 'Acme Corp' },
      { id: '2', full_name: 'Bob Williams', email: 'bob@acmecorp.com', role: 'employee', is_superuser: false, is_active: true, future_time_log_enabled: false, company_name: 'Acme Corp' },
      { id: '3', full_name: 'Carol Brown', email: 'carol@acmecorp.com', role: 'employee', is_superuser: false, is_active: true, future_time_log_enabled: true, company_name: 'Acme Corp' },
      { id: '4', full_name: 'David Lee', email: 'david@acmecorp.com', role: 'employee', is_superuser: false, is_active: false, future_time_log_enabled: false, company_name: 'Acme Corp' },
    ]) })
  } else {
    req.continue()
  }
})

const shot = async (name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log(`✓ ${name}.png`)
}
const wait = (ms) => new Promise(r => setTimeout(r, ms))

// 1. Login page
await page.goto(`${LOCAL}/login`, { waitUntil: 'networkidle0' })
await wait(800)
await shot('01-login')

// 2. Register page
await page.goto(`${LOCAL}/register`, { waitUntil: 'networkidle0' })
await wait(800)
await shot('02-register')

// 3. Dashboard — inject token then navigate
await page.goto(`${LOCAL}/login`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.setItem('token', 'mock-token'))
await page.goto(`${LOCAL}/dashboard`, { waitUntil: 'networkidle0' })
await wait(2000)
await shot('03-dashboard')

// 4. Time entry modal
const days = await page.$$('button.rounded-xl')
for (const btn of days) {
  await btn.click()
  await wait(700)
  const modal = await page.$('.fixed.inset-0')
  if (modal) {
    await shot('04-time-entry-modal')
    await page.keyboard.press('Escape')
    await wait(400)
    break
  }
}

// 5. Admin dashboard
await page.goto(`${LOCAL}/admin`, { waitUntil: 'networkidle0' })
await wait(2000)
await shot('05-admin-dashboard')

// 6. Forgot password — empty form
await page.goto(`${LOCAL}/#/forgot-password`, { waitUntil: 'networkidle0' })
await page.waitForSelector('input[type="email"]', { timeout: 5000 })
await wait(600)
await shot('06-forgot-password')

// 7. Forgot password — sent confirmation
await page.goto(`${LOCAL}/#/forgot-password`, { waitUntil: 'networkidle0' })
await page.waitForSelector('input[type="email"]', { timeout: 5000 })
await wait(300)
await page.type('input[type="email"]', 'john@acmecorp.com')
await wait(200)
await page.click('button[type="submit"]')
await wait(1800)
await shot('07-forgot-password-sent')

// 8. Reset password — form (HashRouter: token goes in hash query)
await page.goto(`${LOCAL}/#/reset-password?token=FAKE_SCREENSHOT_TOKEN`, { waitUntil: 'networkidle0' })
await page.waitForSelector('input[type="password"]', { timeout: 5000 })
await wait(600)
await shot('08-reset-password')

// 9. Reset password — success state
await page.goto(`${LOCAL}/#/reset-password?token=FAKE_SCREENSHOT_TOKEN`, { waitUntil: 'networkidle0' })
await page.waitForSelector('input[type="password"]', { timeout: 5000 })
await wait(300)
const pwInputs = await page.$$('input[type="password"]')
await pwInputs[0].type('NewPassword123')
await pwInputs[1].type('NewPassword123')
await wait(200)
await page.click('button[type="submit"]')
await wait(2000)
await shot('09-reset-password-done')

await browser.close()
console.log('\nAll screenshots saved to docs/screenshots/')
