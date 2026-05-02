import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS = path.join(__dirname, '../docs')
const SHOTS = path.join(DOCS, 'screenshots')

const img = (file) => {
  const data = fs.readFileSync(path.join(SHOTS, file))
  return `data:image/png;base64,${data.toString('base64')}`
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7; color: #1f2937; }

  /* Cover */
  .cover { background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); color: white; padding: 70px 60px 50px; page-break-after: always; }
  .cover .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd; margin-bottom: 10px; }
  .cover h1 { font-size: 36px; font-weight: 800; line-height: 1.2; margin-bottom: 12px; }
  .cover .sub { font-size: 16px; color: #bfdbfe; max-width: 500px; margin-bottom: 40px; }
  .cover .meta { display: flex; gap: 48px; font-size: 12px; color: #93c5fd; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 24px; }
  .cover .meta strong { color: white; display: block; font-size: 13px; margin-bottom: 2px; }

  /* TOC */
  .toc-page { padding: 50px 60px; page-break-after: always; }
  .toc-page h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 16px; }
  .toc { list-style: none; }
  .toc li { display: flex; align-items: baseline; gap: 8px; padding: 6px 0; border-bottom: 1px dotted #e5e7eb; font-size: 14px; }
  .toc li .num { width: 24px; height: 24px; background: #1d4ed8; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .toc li .title { flex: 1; }

  /* Content */
  .page { padding: 48px 60px; }
  .page + .page { border-top: 3px solid #1d4ed8; }
  h2.section { font-size: 22px; font-weight: 800; color: #1d4ed8; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #dbeafe; display: flex; align-items: center; gap: 12px; }
  h2.section .num { width: 32px; height: 32px; background: #1d4ed8; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; }
  h3 { font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 22px 0 10px; }
  p { margin-bottom: 12px; }
  ol, ul { margin: 10px 0 14px 22px; }
  li { margin-bottom: 5px; }
  .tip { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: 13px; color: #1e40af; }
  .warn { background: #fef9c3; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: 13px; color: #713f12; }

  /* Screenshots */
  .screenshot { margin: 20px 0; text-align: center; }
  .screenshot img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
  .screenshot .caption { margin-top: 8px; font-size: 12px; color: #6b7280; font-style: italic; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
  th { background: #1d4ed8; color: white; text-align: left; padding: 10px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f8fafc; }

  /* Footer */
  .footer { background: #1e3a8a; color: #bfdbfe; text-align: center; padding: 28px; font-size: 12px; margin-top: 0; }
  .footer strong { color: white; }

  @media print {
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page + .page { page-break-before: always; border-top: none; }
    .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="label">Employee Guide · v1.3</div>
  <h1>TimekeepingHub<br>Employee User Guide</h1>
  <div class="sub">A step-by-step guide to creating your account, logging your hours, submitting your weekly timesheet, and getting the most out of TimekeepingHub.</div>
  <div class="meta">
    <div><strong>App URL</strong>timekeepinghub.com</div>
    <div><strong>Version</strong>1.3 — May 2026</div>
    <div><strong>Support</strong>Your company admin</div>
  </div>
</div>

<!-- TOC -->
<div class="toc-page">
  <h2>Contents</h2>
  <ul class="toc">
    <li><span class="num">1</span><span class="title">Creating Your Account</span></li>
    <li><span class="num">2</span><span class="title">Signing In</span></li>
    <li><span class="num">3</span><span class="title">Forgot or Reset Your Password</span></li>
    <li><span class="num">4</span><span class="title">Logging Your Hours</span></li>
    <li><span class="num">5</span><span class="title">Submitting Your Timesheet</span></li>
    <li><span class="num">6</span><span class="title">Weekly Summary</span></li>
    <li><span class="num">7</span><span class="title">Signing Out</span></li>
    <li><span class="num">8</span><span class="title">Need Help?</span></li>
  </ul>
</div>

<!-- SECTION 1 -->
<div class="page">
  <h2 class="section"><span class="num">1</span>Creating Your Account</h2>
  <p>Your company admin will give you a <strong>Company Code</strong> — a short identifier unique to your organisation (e.g. <code>fourhub-technologies</code>). Once you have the code:</p>
  <ol>
    <li>Go to <strong>https://timekeepinghub.com/#/register</strong></li>
    <li>Fill in the registration form:
      <ul>
        <li><strong>Your Full Name</strong> — your real name</li>
        <li><strong>Email</strong> — your work email address</li>
        <li><strong>Password</strong> — choose a strong password</li>
        <li><strong>Company Code</strong> — the code your admin gave you</li>
      </ul>
    </li>
    <li>Click <strong>Create Employee Account</strong></li>
    <li>You will be logged in automatically and taken to your dashboard</li>
  </ol>
  <div class="tip">Ask your company admin for the Company Code before filling in the form. If you enter the wrong code you will see a "Company code not found" error.</div>
  <div class="screenshot">
    <img src="${img('02-register.png')}" alt="Register page"/>
    <div class="caption">The registration page — enter your details and the Company Code your admin gave you</div>
  </div>
</div>

<!-- SECTION 2 -->
<div class="page">
  <h2 class="section"><span class="num">2</span>Signing In</h2>
  <ol>
    <li>Go to <strong>https://timekeepinghub.com/#/login</strong></li>
    <li>Enter your <strong>Email</strong> and <strong>Password</strong></li>
    <li>Click <strong>Sign In</strong></li>
  </ol>
  <p>You will be taken to your Weekly Timesheet dashboard.</p>
  <div class="screenshot">
    <img src="${img('01-login.png')}" alt="Login page"/>
    <div class="caption">The login page — enter your email and password to access your dashboard</div>
  </div>
</div>

<!-- SECTION 3 -->
<div class="page">
  <h2 class="section"><span class="num">3</span>Forgot or Reset Your Password</h2>
  <p>If you have forgotten your password, you can reset it by email without contacting your admin.</p>
  <h3>Requesting a Reset Link</h3>
  <ol>
    <li>On the login page, click <strong>Forgot your password?</strong></li>
    <li>Enter the <strong>email address</strong> you registered with</li>
    <li>Click <strong>Send Reset Link</strong></li>
    <li>A confirmation screen will appear — a reset link has been sent to your inbox</li>
  </ol>
  <div class="tip">For security, the confirmation screen is shown regardless of whether the email address is registered. If no email arrives within a few minutes, check your spam folder and confirm you used the right address.</div>
  <div class="screenshot">
    <img src="${img('06-forgot-password.png')}" alt="Forgot password form"/>
    <div class="caption">The forgot password page — enter your email address and click Send Reset Link</div>
  </div>
  <div class="screenshot">
    <img src="${img('07-forgot-password-sent.png')}" alt="Check your email confirmation"/>
    <div class="caption">Confirmation screen — a reset link has been sent to your inbox</div>
  </div>
  <h3>Setting a New Password</h3>
  <ol>
    <li>Open the email from TimekeepingHub and click the <strong>Reset my password</strong> link</li>
    <li>You will be taken to the <strong>Set a new password</strong> page</li>
    <li>Enter your new password — <strong>minimum 8 characters</strong></li>
    <li>Re-enter it in the <strong>Confirm New Password</strong> field</li>
    <li>Click <strong>Set New Password</strong></li>
    <li>A success message will appear and you will be redirected to the sign-in page automatically</li>
  </ol>
  <div class="warn">Reset links expire after <strong>1 hour</strong> and can only be used once. If your link has expired, simply request a new one from the login page.</div>
  <div class="screenshot">
    <img src="${img('08-reset-password.png')}" alt="Reset password form"/>
    <div class="caption">The reset password page — enter and confirm your new password</div>
  </div>
  <div class="screenshot">
    <img src="${img('09-reset-password-done.png')}" alt="Password updated confirmation"/>
    <div class="caption">Password updated — you will be redirected to the sign-in page in 3 seconds</div>
  </div>
</div>

<!-- SECTION 4 -->
<div class="page">
  <h2 class="section"><span class="num">4</span>Logging Your Hours</h2>
  <h3>Your Dashboard</h3>
  <p>After signing in you will see the <strong>Weekly Timesheet</strong> screen. It shows the current week with 7 day cards (Mon–Sun) across the top.</p>
  <ul>
    <li><strong>Today</strong> is highlighted in blue</li>
    <li><strong>Weekend days</strong> (Sat, Sun) have a grey background</li>
    <li>Each day shows a clock dial that fills up as you log hours</li>
  </ul>
  <div class="screenshot">
    <img src="${img('03-dashboard.png')}" alt="Weekly timesheet dashboard"/>
    <div class="caption">The weekly dashboard — 7 day cards showing this week. Today is highlighted in blue</div>
  </div>
  <h3>Adding Hours for a Day</h3>
  <ol>
    <li>Click on any day card</li>
    <li>A time entry panel will open</li>
    <li>Set your <strong>Start time</strong> (e.g. 09:00)</li>
    <li>Set your <strong>End time</strong> (e.g. 17:00)</li>
    <li>Select your <strong>Break time</strong> — choose from: No break, 15 min, 30 min, 1 hr, or click <strong>Custom</strong> and type any number of minutes (e.g. 45, 90)</li>
    <li>Optionally add a <strong>Note</strong> (e.g. "Client meeting", "WFH")</li>
    <li>The <strong>Net worked</strong> time is calculated automatically</li>
    <li>Click <strong>Save</strong></li>
  </ol>
  <p>The day card will update immediately to show your clock-in and clock-out times.</p>
  <div class="screenshot">
    <img src="${img('04-time-entry-modal.png')}" alt="Time entry modal"/>
    <div class="caption">The time entry panel — set start/end times and break, then click Save</div>
  </div>
  <h3>Editing or Deleting an Entry</h3>
  <ul>
    <li>Click on a day that already has an entry</li>
    <li>Change the times or break and click <strong>Update</strong></li>
    <li>To remove the entry, click <strong>Delete</strong></li>
  </ul>
  <h3>Navigating Weeks</h3>
  <ul>
    <li>Use <strong>‹ Prev</strong> and <strong>Next ›</strong> buttons to move between weeks</li>
    <li>Click <strong>Back to this week</strong> to return to the current week</li>
    <li>You can log time for the <strong>current week and the previous week</strong></li>
    <li>Going further back is locked — contact your admin if you need to edit older entries</li>
  </ul>
</div>

<!-- SECTION 5 -->
<div class="page">
  <h2 class="section"><span class="num">5</span>Submitting Your Timesheet</h2>
  <p>At the end of each week, you must submit your timesheet:</p>
  <ol>
    <li>Make sure you have logged hours for all your working days</li>
    <li>The bottom of the screen shows how many days are logged this week</li>
    <li>Click <strong>Submit Week →</strong></li>
    <li>A green confirmation message will appear with your total days and net hours worked</li>
    <li>The button will change to a <strong>✓ Submitted</strong> badge — you cannot submit again for that week</li>
  </ol>
  <div class="warn">Submit your timesheet every week. Once submitted it cannot be changed.</div>
</div>

<!-- SECTION 6 -->
<div class="page">
  <h2 class="section"><span class="num">6</span>Weekly Summary</h2>
  <p>At the bottom of the dashboard you will see three summary cards:</p>
  <table>
    <tr><th>Card</th><th>What it means</th></tr>
    <tr><td><strong>Total logged</strong></td><td>Total time from clock-in to clock-out across all days this week</td></tr>
    <tr><td><strong>Break time</strong></td><td>Total break time deducted across all days</td></tr>
    <tr><td><strong>Net worked</strong></td><td>Your actual worked hours (Total logged − Break time)</td></tr>
  </table>
</div>

<!-- SECTION 7 -->
<div class="page">
  <h2 class="section"><span class="num">7</span>Signing Out</h2>
  <p>Click your name or role badge in the top-right corner of the screen, then click <strong>Sign out</strong>.</p>
</div>

<!-- SECTION 8 -->
<div class="page">
  <h2 class="section"><span class="num">8</span>Need Help?</h2>
  <p>Contact your company admin if you:</p>
  <ul>
    <li>Cannot log in</li>
    <li>Need to edit a locked week</li>
    <li>Were not given your login credentials</li>
  </ul>
</div>

<!-- FOOTER -->
<div class="footer">
  <strong>TimekeepingHub</strong> — Employee User Guide · Version 1.3 · May 2026<br/>
  <span style="margin-top:4px;display:block;">https://timekeepinghub.com</span>
</div>

</body>
</html>`

// Write updated HTML
fs.writeFileSync(path.join(DOCS, 'Employee-User-Guide.html'), html)
console.log('✓ HTML written')

// Generate PDF
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.pdf({
  path: path.join(DOCS, 'TimekeepingHub-Employee-Guide.pdf'),
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' }
})
await browser.close()

console.log('✓ PDF saved to docs/TimekeepingHub-Employee-Guide.pdf')
