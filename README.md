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

Every seeded account uses the password `demo123`.

- `admin@buildlink.et` (admin)
- `sara@buildlink.et`
- `dawit@buildlink.et`
- `hana@buildlink.et`
- `yonas@buildlink.et`
- `meron@buildlink.et`

## Checks

```bash
npm run lint
npx tsc --noEmit
```
