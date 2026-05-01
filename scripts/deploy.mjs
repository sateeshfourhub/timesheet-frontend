/**
 * Usage:  node scripts/deploy.mjs <env>
 *         env = dev | qa | preview | prod
 *
 * Requires FTP_PASSWORD to be set in .env.local (gitignored).
 */

import * as ftp from 'basic-ftp'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Config ──────────────────────────────────────────────────────────────────

const TARGETS = {
  dev:     { mode: 'dev',        remote: '/public_html/dev.timekeepinghub',     user: 'u349028357.timekeepinghub.com' },
  qa:      { mode: 'qa',         remote: '/public_html/qa.timekeepinghub',      user: 'u349028357.timekeepinghub.com' },
  preview: { mode: 'preview',    remote: '/public_html/preview.timekeepinghub', user: 'u349028357.timekeepinghub.com' },
  prod:    { mode: 'production',  remote: '/public_html',                        user: 'u349028357.timekeepinghub.com' },
}

const HOST = '82.180.142.165'
const PORT = 21

// ── Read password from .env.local ────────────────────────────────────────────

const envLocalPath = path.join(ROOT, '.env.local')
let FTP_PASSWORD = process.env.FTP_PASSWORD

if (!FTP_PASSWORD && fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf8').split('\n')) {
    const [k, ...rest] = line.split('=')
    if (k?.trim() === 'FTP_PASSWORD') {
      FTP_PASSWORD = rest.join('=').trim()
      break
    }
  }
}

if (!FTP_PASSWORD) {
  console.error('ERROR: FTP_PASSWORD not set.\nAdd it to .env.local:\n  FTP_PASSWORD=your_password\n')
  process.exit(1)
}

// ── Resolve env ──────────────────────────────────────────────────────────────

const env = process.argv[2]
const target = TARGETS[env]

if (!target) {
  console.error(`ERROR: Unknown env "${env}". Use: dev | qa | preview | prod`)
  process.exit(1)
}

// ── Build ────────────────────────────────────────────────────────────────────

console.log(`\n▶ Building for ${env} (mode: ${target.mode})...`)
execSync(`npm run build:${env === 'prod' ? 'prod' : target.mode}`, { cwd: ROOT, stdio: 'inherit' })
console.log('✓ Build complete\n')

// ── Upload ───────────────────────────────────────────────────────────────────

const client = new ftp.Client()
client.ftp.verbose = false

console.log(`▶ Uploading dist/ → ${target.remote} ...`)

try {
  await client.access({
    host: HOST,
    port: PORT,
    user: target.user,
    password: FTP_PASSWORD,
    secure: false,
  })

  await client.ensureDir(target.remote)

  // Remove only the assets/ subfolder so stale hashed chunks don't accumulate.
  // Never clearWorkingDir() on the root — it would delete subdomain folders.
  try { await client.removeDir(target.remote + '/assets') } catch (_) {}

  await client.uploadFromDir(path.join(ROOT, 'dist'), target.remote)

  console.log(`✓ Upload complete → ftp://${HOST}${target.remote}`)
} catch (err) {
  console.error('FTP error:', err.message)
  process.exit(1)
} finally {
  client.close()
}

console.log(`\n✅ Deploy to ${env} finished.\n`)
