# Banking App TypeScript Playwright Tests

This repository contains a TypeScript + Playwright end-to-end test project for the reference repository Banking_Application.

## What Is Covered

- Authentication flow (customer and manager)
- Role-based access behavior (Users page restriction)
- Accounts page visibility checks
- Transaction creation flow
- Transfer creation flow

The tests are based on the known Banking_Application routes and seeded credentials.

## Reference Test Data (from Banking_Application)

- Customer: ava.smith@novabank.com / ava@123
- Manager: mia.johnson@novabank.com / mia@123

## Prerequisites

- Node.js 18+
- Banking_Application frontend running at http://localhost:5173
- Banking_Application backend running at http://localhost:4000

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install browser binaries:

```bash
npx playwright install
```

3. Create environment file:

```bash
cp .env.example .env
```

If your app uses a different URL or credentials, edit .env.

## Run Tests

```bash
npm test
```

Useful scripts:

- npm run test:ui
- npm run test:headed
- npm run test:debug
- npm run report
- npm run typecheck