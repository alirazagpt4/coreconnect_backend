# CoreConnect Backend — Project Overview

## 1. What this is

CoreConnect is a field-force / retail-merchandising management system for beauty/cosmetics brands. It supports:

- **Beauty Advisors (BAs)** working in-store — clocking in/out with a geotagged selfie, recording sales, and filing daily stock reports (short items, expired stock, used testers, competitor "interceptions").
- **Supervisors / admins** — managing stores, staff hierarchy, product catalog, and viewing dashboards/reports across cities, regions, channels (retail brands like "Al-Fatah"), and product categories.

It is a REST API (Node/Express + MySQL via Sequelize) intended to sit behind a web admin dashboard and a mobile app used by BAs in the field.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js, ES Modules (`"type": "module"` in package.json) |
| Web framework | Express 5 |
| Database | MySQL, via Sequelize 6 ORM (`mysql2` driver) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| File uploads | `multer` (disk storage, local `uploads/` folder) |
| Scheduling | `node-cron` (daily DB backup + old-photo cleanup — see §7) |
| Misc | `moment` (date handling in reports/dashboard), `morgan` (request logging), `cors`, `helmet` (installed but not wired into the running `server.js` — see note below) |
| Migrations/seeders | `sequelize-cli`, plain `.cjs` files in `migrations/` and `seeders/` |

Entry point: `server.js` → `npm start` (`node server.js`) or `nodemon` in dev.

**Note:** there's a `server.txt` in the repo root that is a near-duplicate of `server.js` but with `helmet()` actually wired in (`app.use(helmet())`). It looks like an in-progress edit that never got renamed back to `server.js` — worth reconciling so the real entry point matches whichever version is intended.

## 3. Architecture

Standard layered Express structure, one file per resource in each layer:

```
server.js                 → app bootstrap, route mounting, static file serving
config/db.js               → Sequelize connection (env-driven)
config/config.json          → sequelize-cli's own connection config (separate from db.js — see §8)
middlewares/
  auth.middleware.js        → AuthenticateToken (JWT verify), isAdmin (role gate)
  multer.middleware.js      → disk storage config for file uploads
models/                     → one Sequelize model per table
models/associations.js      → all belongsTo/hasMany relationships wired here, and the
                               ORM's actual "entry point" (re-exports every model)
controllers/                → business logic, one file per resource
routes/                     → Express routers, wire middleware + controllers to paths
services/backupService.js   → cron job: nightly `mysqldump` backup
utils/cleanup.js            → cron job: deletes attendance photos older than N days
uploads/                    → multer's upload destination, served statically at /uploads
backups/                    → mysqldump output destination
migrations/, seeders/       → sequelize-cli schema history and demo data
```

Everything is wired through `models/associations.js` rather than `models/index.js`. `models/index.js` is the default `sequelize-cli` boilerplate (CommonJS, dynamic `require` of every model file) and isn't imported anywhere in the running app — it's only relevant if/when `sequelize-cli` itself loads models, not at runtime.

Request flow: `server.js` mounts one router per resource under `/api/<resource>`, each router applies `AuthenticateToken` (and sometimes `isAdmin`) per-route, then delegates to a controller function that talks to Sequelize models directly (no service/repository layer — controllers *are* the data-access layer).

## 4. Data model

Core entities and how they connect:

**Identity / org structure**
- `User` — staff account. Self-referential hierarchy via `reportTo` → `manager`/`subordinates`. Belongs to `City`, `Region`, `Designation`. Role is an enum: `admin`, `user`, `supervisor`, `brandadmin`, `ccadmin`, `auditor`.
- `City`, `Region`, `Designation` — simple lookup tables (id + name, no timestamps).
- `Channel` — a retail brand/chain (e.g., "Al-Fatah"). Stores belong to a Channel.

**Stores & staffing**
- `Store` — belongs to `City`, `Region`, `Channel`. Can have **up to 3 BAs** assigned (`ba_user_id`, `ba_user_id_2`, `ba_user_id_3`, each a separate `belongsTo User`) plus one `supervisor_id`. Has `targets` (sales target), `poc` (point of contact), `is_active`.

**Catalog**
- `Category` → `SubCategory` (cascade delete) → `ItemMaster` (product). `ItemMaster.price_after_discount` is auto-computed in a `beforeSave` hook from `retail_price` and `discount`.

**Daily field activity** (each is a header + detail-line pattern, one row per store visit per day)
- `Attendance` — one per user per day; `image_uri` (selfie), lat/lng, `isLeave`, `status` (present/absent).
- `Sale` (header) → `SaleItem` (lines). `SaleItem.subtotal` is auto-computed (`qty * price`) in a `beforeSave` hook.
- `ShortItem` (header) → `ShortItemDetail` (lines) — out-of-stock items noted during a store visit.
- `ExpiryStock` (header) → `ExpiryStockDetail` (lines, with a `picture` per line) — expiring/expired stock found in-store.
- `ShortTester` (header) → `ShortTesterDetail` (lines) — depleted product testers.
- `Interception` — standalone (no detail table): daily count of `intercepted` vs `converted` customers, with `ratio` auto-computed in a `beforeSave` hook.

All the header tables (`Sale`, `ShortItem`, `ExpiryStock`, `ShortTester`, `Interception`) follow the same shape: `store_id`, `ba_user_id`, a date field, created via a Sequelize transaction, guarded by a **60-second idempotency window** (reject a duplicate header if the same BA+store combo was submitted in the last 60s) — this pattern is duplicated near-identically across `sale.controller.js`, `expiryStock.controller.js`, `shortItem.controller.js`, `interception.controller.js`, and `shortTester.controller.js` rather than shared.

Most tables carry an `is_active` boolean (added later via `20260312091741-add-is-active-to-all-tables.cjs`), toggled generically through `PATCH /api/status/toggle-status` (`status.controller.js`), which takes a `{ modelName, id }` body and looks up the model dynamically off the `associations.js` exports.

## 5. Authentication & authorization

- **Login**: `POST /api/users/login` with `{ name, password }` → bcrypt-compares against the stored hash → issues a JWT signed with `{ id, role }`.
- **Every protected route** requires an `Authorization: Bearer <token>` header, verified by `AuthenticateToken` (`middlewares/auth.middleware.js`), which sets `req.user = { id, role }` from the token payload.
- **Role gating** is only applied via a second middleware, `isAdmin`, and only on a subset of routes (item CRUD, user delete, store delete). Most create/update endpoints (store, user profile update, all report/dashboard reads) have no role check beyond "is logged in."
- **Hierarchy-aware reads**: the *mobile*-oriented report endpoints (`generateSaleExecutiveReport`, `getAttendanceReportMobile`, `getSalesReportMobile` in `report.controller.js`) scope results to `req.user`'s subordinates via the `reportTo` chain. The desktop-oriented report/dashboard endpoints do not apply this scoping — any authenticated user can query company-wide data by simply not passing a filter.

## 6. API surface

All routes are mounted under `/api`. Grouped by resource:

| Base path | Purpose | Auth |
|---|---|---|
| `/api/users` | login, create/update/delete user, profile, team dropdown, supervisors dropdown | mixed — see §5 |
| `/api/attendance` | `POST /start-day` (clock-in with selfie + GPS) | token required |
| `/api/store` | store CRUD, per-supervisor store list, unique areas | mixed |
| `/api/designations`, `/api/cities`, `/api/regions`, `/api/channels` | read-only lookup dropdowns | token required (channels), unauthenticated read for others — see routes files |
| `/api/category`, `/api/subCategory` | read-only catalog lookups | mixed |
| `/api/items` | product CRUD + search/pagination | token + admin for writes |
| `/api/sales` | `POST /create-sale` (transactional header+lines) | token required |
| `/api/shortitems`, `/api/shorttesters`, `/api/expirestocks` | field-report submission (transactional header+lines, with file uploads for expiry) | token required |
| `/api/interceptions` | daily conversion-funnel entry | token required |
| `/api/reports` | 11 report endpoints (attendance, sales, short items, expiry, testers, interceptions, brand/channel summaries) | token required, mostly unscoped by role |
| `/api/dashboard` | 7 KPI/aggregate endpoints (revenue, sales trend, region/category/store performance, short-item & expiry widgets) | token required, unscoped by role |
| `/api/status` | generic `is_active` toggle for any model | token required |

Static files: `/uploads/*` is served publicly (no auth) from disk — this is where attendance selfies and expiry-stock photos live.

## 7. Background jobs

Two cron-based jobs exist in the codebase but **neither is currently wired into `server.js`** — they're dead code as the app stands today:

- `services/backupService.js` — `node-cron` job scheduled for 3:00 PM PKT daily, shells out to `mysqldump` to back up the DB into `backups/`, then deletes backups older than 7 days via a `find ... -mtime +7 -delete` shell command.
- `utils/cleanup.js` (`initCleanupTask`) — cron job intended to delete attendance selfie files older than a configured window once a day, to keep the `uploads/` folder from growing unbounded.

Both are fully implemented but simply never imported/called from `server.js`.

## 8. Config & environment

- `.env` (gitignored, not committed) drives the runtime: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_DIALECT`, `JWT_SECRET`.
- `config/db.js` is what the app actually connects with at runtime (reads directly from `process.env`).
- `config/config.json` is a **separate**, `sequelize-cli`-only config (used when running `sequelize-cli` migration commands) with its own hardcoded `development`/`test`/`production` blocks — same DB name/credentials duplicated here rather than deriving from `.env`. `config/config.json` is *not* gitignored (only `.env` and `package-lock.json` are), so this file is the one place DB credentials do live in version control.

## 9. Notable design patterns worth knowing about

- **Auto-computed fields via Sequelize hooks**: `SaleItem.subtotal`, `ItemMaster.price_after_discount`, and `Interception.ratio` are all derived in `beforeSave` hooks rather than computed at read time — so these are stored, not virtual, columns.
- **Multi-slot BA assignment**: `Store` supports up to 3 concurrently assigned BAs (primary/secondary/tertiary), and `store.controller.js` enforces that a given BA can only be assigned to one store at a time across all three slots (`checkBAAvailability`).
- **Idempotency-by-time-window**: rather than idempotency keys, duplicate submission protection across all the field-report endpoints is a 60-second lookback query (same BA + same store + created within the last minute → reject as duplicate).
- **Raw SQL correlated subqueries for dashboard aggregates**: `getStoreWisePerformance` (dashboard.controller.js) uses `sequelize.literal()` with hand-written correlated subqueries (revenue/items/interceptions per store) instead of Sequelize's query builder, for performance/Cartesian-product avoidance reasons — everywhere else in the codebase uses the ORM's `include`/`group` API.

## 10. Known issues

A full severity-ranked security/correctness review was done separately in conversation (unauthenticated user-creation endpoint, a privilege-escalation path on user updates, a password-hash leak in the user list endpoint, unscoped company-wide report/dashboard access, no JWT expiry, dead backup/cleanup automation, and several others). That review isn't duplicated here since it's a point-in-time audit rather than durable reference documentation — ask if you want it written up as its own doc alongside this one.
