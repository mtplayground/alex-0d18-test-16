# Prisma

This directory contains the Prisma schema and migration history.

Commands:

- `npm run db:generate` updates the generated Prisma Client.
- `npm run db:migrate:dev` creates and applies local development migrations.
- `npm run db:migrate:deploy` applies committed migrations in deployed environments.
- `npm run db:migrate:status` reports migration state.

All commands that contact the database require `DATABASE_URL` in the process environment.
