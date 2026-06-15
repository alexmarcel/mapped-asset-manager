# Mapped Asset Manager

Mobile-friendly IT asset management with asset registration, QR lookup, photos, history, and an infinite canvas for uploaded floor maps.

## Stack

- Next.js, React, TypeScript, Tailwind CSS
- Prisma and SQLite
- Compressed local folder uploads in `data/uploads`
- Manual ZIP backup and restore
- Konva canvas map
- Docker Compose for VPS deployment behind Traefik

## Local development

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Local development uses `npm run dev` directly. Docker is only for VPS deployment.

The default SQLite database path is `data/app.db`. The `DATABASE_URL` uses `file:../data/app.db` because Prisma resolves SQLite paths from `prisma/schema.prisma`. Uploaded asset photos and floor maps are compressed to WebP, stored under `data/uploads`, and served by the app through `/uploads/...`.

Seed logins:

- `admin@example.com` / `admin12345`
- `staff@example.com` / `staff12345`

## VPS Docker deployment

This repository includes a VPS-oriented `docker-compose.yml` for `aset.alexmarcel.com`. It expects an existing Traefik reverse proxy using the external Docker network `web` and ACME resolver `myresolver`.

1. On the VPS, make sure the shared Traefik network exists:

```bash
docker network create web
```

2. Copy `.env.example` to `.env` and change passwords/secrets.
3. Keep `DATABASE_URL="file:../data/app.db"`.
4. Set production values such as:

```bash
APP_URL="https://your-site.com"
UPLOAD_DIR="/app/data/uploads"
```

5. Run the deployment:

```bash
docker compose up -d --build
```

6. Run migrations in the app container:

```bash
docker compose exec aset npm run prisma:deploy
```

7. Seed the first users and defaults:

```bash
docker compose exec aset npm run prisma:seed
```

Use Settings > Backup and Restore to download a ZIP containing `data/app.db` and uploaded files. You can also back up the app manually by copying the whole `data` directory while the app is stopped, or by taking a filesystem snapshot of it.
