# BuildLink ET

Hackathon MVP for construction jobs, surplus materials, equipment rentals, and professionals in Southwest Ethiopia. Phase 1 is the shared account, locations, models, and layout.

## Run

```bash
npm install
npm run seed
npm run dev
```

MongoDB must be running at `mongodb://127.0.0.1:27017/buildlink-et`. Copy `.env.example` to `.env.local` if you do not already have one. `.env.local` stays out of git.

Open http://localhost:3000

Seeded accounts (password is only in the seed script, never shown in the UI):

- Abel Mekonnen, admin
- Sara Tadesse, Meron Haile, Abebe Bekele, employers
- Dawit Kebede, Hana Alemu, Yonas Girma, contractors

## Checks

```bash
npm run lint
npx tsc --noEmit
```
