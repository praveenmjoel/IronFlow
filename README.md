# IronFlow — Personal Workout OS

A precision workout planning and tracking web app built for progressive overload, biceps growth, HIIT cardio, and daily accountability.

---

## Run Locally

```bash
# From the IronFlow directory
npm install
npm run dev
```

Open **http://localhost:3030** in your browser.

> **Note:** Due to a breaking change in the Next.js 16 binary, the `npm run dev` script calls `node node_modules/next/dist/bin/next dev` directly. This is already configured in `package.json` — no action needed.

---

## Features

### Dashboard
- Today's workout card with completion ring
- Streak tracker, XP, and total workouts
- 7-day consistency bar chart with sparkline
- Weekly workout plan overview (all 7 days)
- Body measurement snapshot

### Guided Workout Execution (`/workout/[day]`)
- **Per-rep checkboxes** — tap each individual rep to track it
- **Warm-up phase** with 8-step activation sequence
- **Main workout** with sets, exact weights (kg), tempo guidance, breathing cues
- **Dos & Don'ts** for every exercise
- **Rest timer** with countdown ring (auto-starts after set completion)
- **Elliptical HIIT engine** with per-interval timers and resistance levels
- **Cool-down phase** with stretching sequence
- Real-time completion percentage in the header ring
- Workout completion modal with summary

### 6-Day Program (from your Excel plan)
| Day | Focus |
|-----|-------|
| 1 | Elliptical HIIT + Abs Circuit (Resistance 9–11, 6 rounds) |
| 2 | Biceps Focus — Standing Curl, Hammer, Incline, Triceps, Laterals |
| 3 | Fat Burn Steady State (35 min, Resistance 5–6) + Core |
| 4 | Biceps Volume + Chest (Push-ups with brackets) |
| 5 | HIIT Cardio + Abs Circuit |
| 6 | Barbell Strength — Curl, Row, Squat, OHP + Core Burnout |
| 7 | Active Recovery — Mobility & Savasana |

### Exercise Database (`/exercises`)
- 32 exercises across 7 muscle groups
- Search by name or muscle
- Filter by category and equipment
- Full instruction cards with form cues, breathing, safety notes

### Body Measurements (`/measurements`)
- Track: weight, biceps (L/R), waist, chest, hips, resting HR
- Line chart for any metric over time
- Delta indicators (up/down vs previous)
- Full history log

### Analytics (`/analytics`)
- Completion trend over time
- Sessions per week bar chart
- Performance by workout day
- Workout type distribution (pie chart)
- Body weight & bicep size trend charts
- Achievements / badge system (8 badges)

### Calendar (`/calendar`)
- Full monthly calendar view
- Color dots for completed vs partial sessions
- Tap any date to see workout details or start that day

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand (persisted to localStorage) |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | CSS keyframes |

---

## Weight Combinations (Your Equipment)

Plates: 4 × 1.25 kg · 4 × 1.5 kg · 4 × 2 kg

| Loading | Per dumbbell | Total |
|---------|-------------|-------|
| Rod only | 0 kg | 0 kg |
| 1.25 per side | 1.25 kg | 2.5 kg |
| 1.5 per side | 1.5 kg | 3.0 kg |
| 2 per side | 2.0 kg | 4.0 kg |
| 1.25+1.25 per side | 2.5 kg | 5.0 kg |
| 1.5+1.25 per side | 2.75 kg | 5.5 kg |
| 1.5+1.5 per side | 3.0 kg | 6.0 kg |
| 2+1.25 per side | 3.25 kg | 6.5 kg |
| 2+1.5 per side | 3.5 kg | 7.0 kg |
| 2+2 per side | 4.0 kg | 8.0 kg |

---

## Data Persistence

All data is stored in **localStorage** under the key `ironflow-storage`. No backend or account required. Data survives page refreshes and browser restarts.

To reset: open DevTools → Application → Local Storage → delete `ironflow-storage`.
