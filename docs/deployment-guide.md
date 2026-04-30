# TimekeepingHub — Deployment Guide

## Environments

| Environment | Frontend URL | Hostinger Folder | Railway Backend |
|---|---|---|---|
| Dev | https://dev.timekeepinghub.com | `public_html/dev.timekeepinghub` | `timesheet-backend-dev` |
| Production | https://timekeepinghub.com | `public_html` | `timesheet-backend-production-5f2d` |
| QA | https://qa.timekeepinghub.com | `public_html/qa.timekeepinghub` | `timesheet-backend-qa` *(inactive)* |
| Preview | https://preview.timekeepinghub.com | `public_html/preview.timekeepinghub` | `timesheet-backend-preview` *(inactive)* |

---

## Git Branching Strategy

```
feature/short-description  →  develop  →  main
```

- **Never commit directly to `main` or `develop`**
- All work starts on a `feature/...` branch off `develop`
- PRs to `develop` — auto-complete after dev testing passes
- PRs to `main` — require Sateesh's approval, never auto-merge
- Production deploys via a Git **tag** created from `develop`

### Starting a new feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-description
```

### Finishing a feature

```bash
# push feature branch
git push -u origin feature/short-description

# open PR: feature/short-description → develop (auto-complete after dev test)
```

---

## Frontend Deployment

### Prerequisites

- VS Code with the **SFTP** extension (Natiyzskunk.sftp)
- Node.js installed
- Hostinger FTP credentials for `u349028357.timekeepinghub.com`

### Build commands

| Environment | Command |
|---|---|
| Dev | `npm run build:dev` |
| QA | `npm run build:qa` |
| Preview | `npm run build:preview` |
| Production | `npm run build:prod` |

### Deploy steps

1. Run the correct build command (see above)
2. In VS Code: `Cmd+Shift+P` → `SFTP: Upload Project`
3. Select the target environment from the list
4. Enter the Hostinger FTP password when prompted
5. Wait for the upload to complete

### Environment variables (build-time)

Each environment has its own `.env` file — these are **gitignored** and must be kept locally:

| File | VITE_API_URL |
|---|---|
| `.env.dev` | `https://timesheet-backend-dev.up.railway.app` |
| `.env.qa` | `https://timesheet-backend-qa.up.railway.app` |
| `.env.preview` | `https://timesheet-backend-preview.up.railway.app` |
| `.env.production` | `https://timesheet-backend-production-5f2d.up.railway.app` |

> These values are baked into the JS bundle at build time — they are not set at runtime.

### .htaccess (SPA routing)

Each Hostinger folder requires a `.htaccess` file for React client-side routing to work. This file is created **once** manually via hPanel → File Manager. FTP does not overwrite it on future deploys.

Content for all environments:
```
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## Backend Deployment

Backend repo: https://github.com/sateeshfourhub/timesheet-backend

The backend auto-deploys to Railway when commits are pushed to the relevant branch. No manual steps needed.

- `develop` branch → deploys to Railway **dev** environment
- Tags (e.g. `v1.2.3`) → deploy to Railway **production** environment

---

## Production Release Process

1. Ensure all features are tested on `dev.timekeepinghub.com`
2. Merge `feature/...` → `develop` (auto-complete PR)
3. Create a Git tag from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git tag v1.x.x
   git push origin v1.x.x
   ```
4. Build and deploy frontend to production:
   ```bash
   npm run build:prod
   # SFTP: Upload Project → timekeepinghub - production
   ```
5. Verify https://timekeepinghub.com is working
6. Open PR: `develop` → `main` — **wait for Sateesh's approval**

---

## SFTP Config Reference

File: `.vscode/sftp.json`

- Host: `82.180.142.165`
- Protocol: `ftp`
- Port: `21`
- Username (timekeepinghub): `u349028357.timekeepinghub.com`
- Username (fourhubtech): `u349028357.fourhubtech.com`

---

## Hostinger hPanel

- FTP Accounts: hPanel → Files → FTP Accounts
- File Manager: hPanel → Files → File Manager
- Subdomains: hPanel → Domains → Subdomains
