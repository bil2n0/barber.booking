/**
 * The Sharp Barber — backend running inside a Google Sheet (Google Apps Script).
 *
 *  - Appointments are rows in the "Appointments" tab of this spreadsheet.
 *  - The admin username/password live in  Project Settings > Script properties
 *    (ADMIN_USERNAME / ADMIN_PASSWORD). Change them there any time.
 *
 * Keep SERVICE_IDS / SHOP_HOURS / SLOT_MINUTES in sync with contracts/booking.ts
 * if you change services or opening hours on the website.
 */

var SHEET_NAME = 'Appointments';
var HEADERS = ['id', 'clientName', 'phone', 'serviceId', 'date', 'time', 'status', 'createdAt'];

var SERVICE_IDS = ['cut', 'skin-fade', 'beard', 'shave', 'cut-beard', 'junior'];
// Opening hours by weekday, 0 = Sunday ... 6 = Saturday. null = closed. [openHour, closeHour]
var SHOP_HOURS = [null, null, [9, 19], [9, 19], [9, 19], [9, 20], [9, 17]];
var SLOT_MINUTES = 30;
var BOOKABLE_DAYS_AHEAD = 60;

var SESSION_SECONDS = 6 * 60 * 60; // 6 h (the maximum Apps Script cache allows)
var MAX_FAILED_LOGINS = 5; // then locked for 10 minutes
var STATUSES = ['booked', 'done', 'cancelled'];

/* ───────────── Entry points ───────────── */

function doGet() {
  return ContentService.createTextOutput('The Sharp Barber API is running.');
}

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    out = { ok: true, data: route_(req) };
  } catch (err) {
    if (err && err.userMessage) {
      out = { ok: false, error: err.userMessage };
    } else {
      console.error(err);
      out = { ok: false, error: 'Something went wrong. Please try again.' };
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to create the Appointments tab. */
function setup() {
  sheet_();
}

function route_(req) {
  switch (req.action) {
    case 'bookedSlots':
      return bookedSlots_(req.date);
    case 'create':
      return createAppointment_(req);
    case 'login':
      return login_(req.username, req.password);
    case 'logout':
      CacheService.getScriptCache().remove('sess_' + String(req.token || ''));
      return true;
    case 'me':
      var user = sessionUser_(req.token);
      return user ? { username: user } : null;
    case 'appointments':
      requireAdmin_(req.token);
      return listAppointments_(req.fromDate);
    case 'setStatus':
      requireAdmin_(req.token);
      return setStatus_(req.id, req.status);
    case 'remove':
      requireAdmin_(req.token);
      return removeAppointment_(req.id);
    default:
      throw userError_('Unknown action.');
  }
}

/* ───────────── Public actions ───────────── */

function bookedSlots_(date) {
  checkDate_(date);
  return readAll_()
    .filter(function (a) { return a.date === date && a.status !== 'cancelled'; })
    .map(function (a) { return a.time; });
}

function createAppointment_(req) {
  var name = String(req.clientName || '').trim();
  var phone = String(req.phone || '').trim();
  var serviceId = String(req.serviceId || '');
  var date = String(req.date || '');
  var time = String(req.time || '');

  if (name.length < 2 || name.length > 120) throw userError_('Please enter your name');
  if (!/^[+()\-.\s\d]{7,20}$/.test(phone)) throw userError_('Please enter a valid phone number');
  if (SERVICE_IDS.indexOf(serviceId) === -1) throw userError_('Unknown service.');
  checkDate_(date);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw userError_('Invalid time');

  var yesterday = dateString_(new Date(Date.now() - 24 * 3600 * 1000));
  var last = dateString_(new Date(Date.now() + BOOKABLE_DAYS_AHEAD * 24 * 3600 * 1000));
  if (date < yesterday || date > last) throw userError_('That date is not bookable.');

  var p = date.split('-');
  var weekday = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12).getDay();
  if (slotsForDay_(weekday).indexOf(time) === -1) throw userError_('That time is outside opening hours.');

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var rows = readAll_();
    var clash = rows.some(function (a) {
      return a.date === date && a.time === time && a.status !== 'cancelled';
    });
    if (clash) throw userError_('That slot was just taken — pick another time.');

    var id = rows.reduce(function (m, a) { return Math.max(m, a.id); }, 0) + 1;
    var createdAt = new Date().toISOString();
    sheet_().appendRow([id, name, phone, serviceId, date, time, 'booked', createdAt]);
    SpreadsheetApp.flush();
    return { id: id, clientName: name, phone: phone, serviceId: serviceId, date: date, time: time, status: 'booked', createdAt: createdAt };
  } finally {
    lock.releaseLock();
  }
}

/* ───────────── Admin actions ───────────── */

function login_(username, password) {
  var props = PropertiesService.getScriptProperties();
  var adminUser = String(props.getProperty('ADMIN_USERNAME') || '').trim();
  var adminPass = String(props.getProperty('ADMIN_PASSWORD') || '');
  if (!adminUser || !adminPass) {
    throw userError_('Admin login is not set up yet. Add ADMIN_USERNAME and ADMIN_PASSWORD in Script properties.');
  }

  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('failed_logins') || 0);
  if (fails >= MAX_FAILED_LOGINS) throw userError_('Too many attempts. Wait 10 minutes and try again.');

  var okUser = safeEqual_(String(username || '').trim(), adminUser);
  var okPass = safeEqual_(String(password || ''), adminPass);
  if (!(okUser && okPass)) {
    cache.put('failed_logins', String(fails + 1), 600);
    throw userError_('Wrong username or password.');
  }

  cache.remove('failed_logins');
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  cache.put('sess_' + token, credentialFingerprint_(adminUser, adminPass), SESSION_SECONDS);
  return { token: token, username: adminUser };
}

/** Returns the admin username for a valid session token, otherwise null. */
function sessionUser_(token) {
  token = String(token || '');
  if (!token) return null;
  var stored = CacheService.getScriptCache().get('sess_' + token);
  if (!stored) return null;
  var props = PropertiesService.getScriptProperties();
  var adminUser = String(props.getProperty('ADMIN_USERNAME') || '').trim();
  var adminPass = String(props.getProperty('ADMIN_PASSWORD') || '');
  // If the username or password was changed, old sessions stop working.
  if (!adminUser || !adminPass || stored !== credentialFingerprint_(adminUser, adminPass)) return null;
  return adminUser;
}

function requireAdmin_(token) {
  if (!sessionUser_(token)) throw userError_('Session expired — sign in again.');
}

function listAppointments_(fromDate) {
  if (fromDate) checkDate_(fromDate);
  var rows = readAll_().filter(function (a) { return !fromDate || a.date >= fromDate; });
  rows.sort(function (a, b) {
    if (a.date !== b.date) return fromDate ? (a.date < b.date ? -1 : 1) : (a.date < b.date ? 1 : -1);
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });
  return rows;
}

function setStatus_(id, status) {
  if (STATUSES.indexOf(status) === -1) throw userError_('Invalid status.');
  var rowNum = findRow_(id);
  sheet_().getRange(rowNum, HEADERS.indexOf('status') + 1).setValue(status);
  return true;
}

function removeAppointment_(id) {
  sheet_().deleteRow(findRow_(id));
  return true;
}

/* ───────────── Helpers ───────────── */

function userError_(message) {
  var err = new Error(message);
  err.userMessage = message;
  return err;
}

function checkDate_(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) throw userError_('Invalid date');
}

function slotsForDay_(weekday) {
  var hours = SHOP_HOURS[weekday];
  if (!hours) return [];
  var out = [];
  var total = (hours[1] - hours[0]) * 60;
  for (var m = 0; m < total; m += SLOT_MINUTES) {
    var t = hours[0] * 60 + m;
    out.push(pad2_(Math.floor(t / 60)) + ':' + pad2_(t % 60));
  }
  return out;
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

function dateString_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function safeEqual_(a, b) {
  var diff = a.length === b.length ? 0 : 1;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function credentialFingerprint_(user, pass) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, user + '\n' + pass);
  return Utilities.base64Encode(bytes);
}

function sheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // Plain-text format so Sheets never turns "2026-10-05" or "09:30" into date/time values
    // and never treats "+1 555…" or "=..." as a formula.
    sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@');
  }
  return sh;
}

function fmtDate_(v) {
  return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v);
}
function fmtTime_(v) {
  return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm') : String(v);
}

function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values
    .filter(function (r) { return r[0] !== '' && r[0] !== null; })
    .map(function (r) {
      return {
        id: Number(r[0]),
        clientName: String(r[1]),
        phone: String(r[2]),
        serviceId: String(r[3]),
        date: fmtDate_(r[4]),
        time: fmtTime_(r[5]),
        status: String(r[6]),
        createdAt: r[7] instanceof Date ? r[7].toISOString() : String(r[7]),
      };
    });
}

/** Sheet row number (1-based) of the appointment with this id. */
function findRow_(id) {
  id = Number(id);
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last >= 2) {
    var ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (Number(ids[i][0]) === id) return i + 2;
    }
  }
  throw userError_('Appointment not found.');
}
