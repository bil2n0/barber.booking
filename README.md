 static booking site (GitHub Pages + Google Sheets) : 
 link : https://bil2n0.github.io/barber.booking/#/

No server and no SQL database. Just used some  static files hosted on GitHub Pages.
Bookings are stored as rows in a **Google Sheet** (via a small Google Apps Script), and the
admin login lives in the script's settings.

```
visitor's browser ──► GitHub Pages (React site)
                           │  fetch()
                           ▼
                 Google Apps Script web app ──► Google Sheet "Appointments"
```

## 1. Create the Google Sheet backend (5 min)

1. Go to <https://sheets.new> and name the spreadsheet e.g. *Barber bookings*.
2. **Extensions → Apps Script**. Delete the sample code, paste in the content of
   `apps-script/Code.gs`, click **Save**.
3. In the function dropdown pick **setup** and click **Run** (accept the permission prompts;
   "Advanced → Go to project (unsafe)" is normal for your own scripts). An *Appointments* tab appears.
4. **Admin login:** left sidebar ⚙ **Project Settings → Script properties → Add script property**
   - `ADMIN_USERNAME` = your username
   - `ADMIN_PASSWORD` = your password
5. **Deploy → New deployment → ⚙ Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (ends with `/exec`).

## 2. Connect the website

Open `src/config.ts` and paste the URL:

```ts
export const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

(Left empty, the site runs in *demo mode*: data stays in the visitor's own browser. Demo login: `barber` / `sharp2024`.)

## 3. Put it on GitHub Pages

1. Create a new GitHub repository and push the **contents of this folder** to the `main` branch.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push.
   Your site appears at `https://<your-user>.github.io/<repo>/`, admin at `.../#/admin`.

## Changing the admin username / password

Apps Script editor → ⚙ Project Settings → Script properties → edit `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
It takes effect immediately and signs out any existing admin session. No redeploy needed.

## Editing bookings directly

Open the Google Sheet — each booking is a row. You can read, edit or delete rows by hand
(keep the date as `YYYY-MM-DD` and time as `HH:MM`, and keep the `id` column unique).

## Changing hours or services

Edit `contracts/booking.ts` (the website) **and** the matching lines at the top of
`apps-script/Code.gs` (`SERVICE_IDS`, `SHOP_HOURS`, `SLOT_MINUTES`). After editing Code.gs choose
**Deploy → Manage deployments → ✏ → Version: New version → Deploy** (the URL stays the same).

## Local development

```
npm install
npm run dev
```

## Limits to know about

- Anyone with the web-app URL can call it; the public actions (see free slots, book) are open by design,
  admin actions need the password. The login locks for 10 minutes after 5 wrong attempts.
- Google Apps Script has daily quotas (generous for one shop) and each call takes ~0.5–2 s.
- An admin session lasts up to 6 hours.
