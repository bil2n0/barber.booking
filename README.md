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
