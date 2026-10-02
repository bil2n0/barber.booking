# Deploy guide

1. Create a MySQL database (Aiven / TiDB Cloud / Railway) and copy its connection URL.
2. Locally: `npm install && npm install -D tsx`
3. Create `.env` with `DATABASE_URL=...`, `APP_ID=barber`, `APP_SECRET=<long random string>`
4. `npm run db:push`                      (creates the tables)
5. `npm run db:admin -- myuser mypassword` (creates / changes the admin login)
6. Push to GitHub, then create a Web Service on Render:
   Build: `npm install && npm run build`   Start: `npm start`
   Env vars: DATABASE_URL, APP_ID, APP_SECRET
