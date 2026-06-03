# alex-0d18-test-16

## Environment

Copy `.env.example` to a local environment file and replace the sample values
with real PostgreSQL, Auth.js, and object storage settings. The application reads
configuration from process environment variables; secrets must not be committed.

Required runtime settings:

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: Auth.js secret with at least 32 characters.
- `AUTH_URL`: Public application URL, for example `https://example.com`.
- `HOST`: Bind host. Defaults to `0.0.0.0`.
- `PORT`: Bind port. Defaults to `8080`.
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`: S3-compatible object storage.
- `S3_PUBLIC_BASE_URL`: Optional public object URL base.

Validate environment configuration before building or starting:

```bash
npm run env:check
```

## Self-hosted Startup

Install dependencies, generate Prisma Client, run migrations, build, and start:

```bash
npm ci
npm run self-host:build
npm run self-host:start
```

`self-host:start` runs pending PostgreSQL migrations before starting Next.js on
`${HOST:-0.0.0.0}:${PORT:-8080}`.

The app also exposes a lightweight readiness endpoint:

```bash
curl http://127.0.0.1:8080/api/health
```

## Validation

```bash
npm run lint
npm run format:check
npm run db:generate
npm test
npm run build
```

End-to-end tests require Playwright browsers:

```bash
npx playwright install chromium
npm run test:e2e
```
