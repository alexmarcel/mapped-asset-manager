# Mapped Asset Manager

Mobile-friendly IT asset management with asset registration, QR lookup, photos, history, and an infinite canvas for uploaded floor maps.

## Stack

- Next.js, React, TypeScript, Tailwind CSS
- Prisma and SQLite
- MinIO S3-compatible file storage
- Konva canvas map
- Docker Compose for VPS deployment

## Local development

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Local development uses `npm run dev` directly. Docker is only for VPS deployment.

The default SQLite database path is `data/app.db`. The `DATABASE_URL` uses `file:../data/app.db` because Prisma resolves SQLite paths from `prisma/schema.prisma`. For uploads, point the S3/MinIO variables to an S3-compatible service available from your machine. Photo and map upload features need that storage endpoint; the rest of the app can still be developed against SQLite.

Seed logins:

- `admin@example.com` / `admin12345`
- `staff@example.com` / `staff12345`

## VPS Docker deployment

1. Copy `.env.example` to `.env` and change passwords/secrets.
2. Point `APP_URL` and `S3_PUBLIC_BASE_URL` at your domain.
3. Run `docker compose up -d --build`.
4. Run migrations in the app container: `docker compose exec app npm run prisma:deploy`.
5. Seed the first users and defaults: `docker compose exec app npm run prisma:seed`.

Update `Caddyfile` with your real domain before public VPS use.

Back up the app database by copying `data/app.db` while the app is stopped, or by taking a filesystem snapshot of the mounted `data` directory.
