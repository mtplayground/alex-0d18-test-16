# Product Snapshot

## What This Project Is

`alex-0d18-test-16` is a self-hosted social posting application built with
Next.js App Router and TypeScript. It supports account creation, credential
login, a global post feed, post detail pages, replies, user profiles, profile
editing, avatar uploads, and document attachments.

## Core Features

- Public pages: global post feed with SSR pagination, post detail pages, user
  profile pages, sign-up, and sign-in.
- Authenticated pages: create-post form and edit-profile form.
- Auth: Auth.js Credentials provider with bcrypt password hashing and JWT
  sessions.
- Posts: title/body posts authored by users, ordered newest first in the feed.
- Replies: authenticated users can reply on post detail pages.
- Uploads: reusable upload UI plus `/api/upload` validation for avatar images
  and document attachments; storage is S3-compatible object storage.
- Profiles: display name and avatar editing, with profile pages showing user
  stats and authored posts.
- SEO: root and per-page metadata, Open Graph/Twitter metadata, dynamic
  sitemap, robots.txt, and JSON-LD for post detail pages.
- Error handling: route and global error boundaries, not-found/loading states,
  form-level validation messages, and `/api/health` readiness endpoint.

## Architecture And Data

- Framework: Next.js 16 App Router, React 19, TypeScript.
- Styling: Tailwind CSS with shared global styles and simple layout components.
- Persistence: PostgreSQL only, accessed through Prisma 7 with
  `@prisma/adapter-pg`.
- Data models: `User`, `Post`, `Reply`, and `Attachment`.
- Object storage: S3-compatible client helpers in `lib/storage.ts`.
- Environment validation: `lib/env.ts` for runtime parsing and
  `scripts/validate-env.mjs` for deployment checks.
- Route organization: public routes live in `app/(public)`, authenticated
  routes live in `app/(app)`, and shared logic lives in `actions`, `components`,
  `lib`, and `types`.

## Conventions

- The app listens on `${HOST:-0.0.0.0}:${PORT:-8080}`.
- Required runtime configuration is documented in `.env.example`; secrets must
  come from environment variables and must not be committed.
- Use `npm run self-host:build` and `npm run self-host:start` for bare
  self-hosted deployment. `self-host:start` runs pending PostgreSQL migrations
  before starting the app.
- Use `npm run env:check` before build/start to validate required environment
  variables.
- Uploads must be persisted through PostgreSQL attachment records and
  S3-compatible object storage; do not use local files, in-memory state, or
  SQLite for persistent state.

## Validation

- Unit tests: Vitest covers password hashing, auth/signup action behavior,
  post/reply server actions, upload validation, and upload API behavior.
- E2E: Playwright covers the core flow of sign-up, sign-in, document upload,
  post creation, reply, avatar upload, and profile visibility.
- Standard checks: `npm run lint`, `npm run format:check`,
  `npm run db:generate`, `npm test`, and `npm run build`.
