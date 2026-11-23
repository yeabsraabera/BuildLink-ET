# BuildLink ET

**Build Smarter. Connect Better. Waste Less.**

BuildLink ET is a hackathon MVP: one platform where Southwest Ethiopia's construction industry finds jobs, trusted contractors, surplus materials and rental equipment through a single account. The pilot town is Jimma.

> **Status:** working prototype. It does not process payments, hold deposits, provide insurance or officially certify anyone. See [Scope and limitations](#scope-and-limitations).

## The problem

Construction work in and around Jimma is mostly arranged through phone calls, social-media groups and personal contacts. Our hypotheses, not yet validated by field interviews, are that this makes it hard to:

- find and compare skilled workers,
- show experience and past work to potential clients,
- sell leftover materials that would otherwise go to waste,
- rent equipment instead of buying it, or earn from equipment sitting idle.

## Features

| Module | What it does |
|---|---|
| **Jobs** | Employers post work with required skills, duration and a stated fee. Contractors apply with a message and optional proposed fee. Employers review applicants, shortlist and accept. |
| **Professionals** | Every user has a profile with skills, experience and ratings from past employers. Ratings are only possible after an accepted job. |
| **Materials** | Users list surplus materials by category and town. Buyers send inquiries. Agreed deals mark the listing Reserved, completed deals mark it Sold and hide it. |
| **Rentals** | Owners list equipment. Renters request dates. Approving a booking that overlaps an already approved one is refused with HTTP 409. |
| **Admin** | Platform stats, professional verification queue, reported listings, an audit log and a configurable list of towns. |

One account works across all modules. Every page except the landing page, login and register requires a signed-in user.

## Tech stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS, light and dark mode
- **Database:** MongoDB Atlas with Mongoose
- **Auth:** email and password, `bcryptjs`, JWT in an httpOnly cookie (`jose`)
- **Validation:** `zod` on every API input

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 cluster works)

### Setup

```bash
git clone https://github.com/yeabsraabera/BuildLink-ET.git
cd BuildLink-ET
npm install
```

Create a file named `.env.local` in the project root:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/buildlink-et?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
```

Never commit `.env.local`. A template is available in `.env.example`.

In MongoDB Atlas, add your IP address under **Network Access** (or allow `0.0.0.0/0` for a short-lived demo database). Use a database password with letters and numbers only, because symbols can break the connection string.

### Seed demo data and run

```bash
npm run seed   # safe to run more than once; it does not create duplicate admins
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

The seed script creates demo users. All use the password `demo123`.

| Email | Role |
|---|---|
| `admin@buildlink.et` | Admin |
| `sara@buildlink.et`, `meron@buildlink.et` | Employers and owners |
| `dawit@buildlink.et`, `hana@buildlink.et`, `yonas@buildlink.et` | Contractors and professionals |

The seed also creates an approved rental booking for 2026-12-01 to 2026-12-05. Requesting overlapping dates and approving them shows the 409 conflict check.

If you deploy publicly, change or remove these accounts.

## API overview

All responses use `{ success, message, data }`, or `{ success: false, message, errors? }` on failure. Status codes used: 200, 201, 400, 401, 403, 404, 409.

| Route | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me` | Authentication and session |
| `/api/listings?type=job\|material\|rental\|professional` | Browse and manage all listing types (`q`, `category`, `location`, `page`, `limit`, `mine=true`) |
| `/api/requests` | Applications, inquiries and rental requests (`box=incoming\|outgoing`) |
| `GET /api/locations`, `GET /api/stats` | Towns and public counts |
| `/api/admin/*` | Stats, users, reports, verification, locations, audit log (admin only) |

## Rules enforced on the server

- Only a listing's owner can edit it, delete it or change its status. Only the request's recipient can set owner-side statuses, and only the requester can withdraw.
- You cannot apply or request on your own listing, and a job allows one active application per user.
- Rental approval returns 409 if the dates overlap another approved booking.
- Professional verification can only be requested by the owner. Only an admin can set it to verified or rejected.
- Public responses expose an owner's name and town only, never email or password data.
- Every admin route checks admin status on the server and writes an audit log entry.

## Scope and limitations

This is an MVP built in a hackathon. It intentionally does **not** include:

- payments, escrow or insurance,
- official credential or licence verification ("verified" means an admin reviewed the profile inside this prototype),
- file uploads (images are URLs),
- email or SMS notifications,
- inspection of listed materials. BuildLink ET has not inspected any item.

## Roadmap

1. Interview contractors, workers and equipment owners in Jimma to validate demand.
2. Photo uploads, in-app notifications and messaging.
3. Real credential verification, and mobile payments after legal review.
4. Amharic and Afaan Oromo support.
5. Expansion to Agaro, Bedele, Mettu and Bonga.

## Screenshots

Add images to `docs/screenshots/` and keep the links below.

![Landing page](docs/screenshots/home_hero.png)
![Login](docs/screenshots/login_page.png)
![Create account](docs/screenshots/register_page.png)
