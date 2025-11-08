# AME Mentor — EASA B1/B2 Quiz Builder

Interactive quiz workbench that ingests your EASA B1/B2 question bank from a published Google Sheets CSV (or any CSV endpoint) and serves two study modes:

- **Learning mode** – one question at a time with instant feedback, explanations, and lightweight spaced review vibes.
- **Timed mode** – full‑set exam simulation against a countdown clock with answer reveal + analysis at the end.

At the end of every run you get a module‑level breakdown that highlights strengths and where to focus next.

## Quick start

```bash
npm install
npm run dev
```

You can test the experience immediately with the bundled sample data (`Use bundled sample` in the UI or `public/sample-question-bank.csv`).

Prefer a preview first? The latest build lives on GitHub Pages: https://gideonamani.github.io/EASA-B1B2-Quizzes/ — open it in any modern browser to try the configurator, learning mode, timed mode, and summaries without installing anything.

## CSV contract

The loader expects the following header names:

| Column       | Purpose                                               |
| ------------ | ----------------------------------------------------- |
| `module`     | High-level ATA area (e.g., Airframe)                  |
| `submodule`  | Sub-topic (Hydraulics, Lightning, etc.)               |
| `question`   | Prompt text                                           |
| `option_a`–`option_d` | Answer choices (leave blank if unused)      |
| `correct`    | Letter (`a`–`d`) of the correct option                |
| `explanation`| Optional rationale shown during review               |
| `difficulty` | Any label (`easy`, `B2`, etc.)                        |
| `tags`       | Comma/semicolon list used for analytics (`hydraulics`)|

Any blank rows are ignored. You can include more than four options by duplicating columns (`e`, `f`, …) once you add them both in the CSV and in `OPTION_KEYS` inside `src/utils/csv.ts`.

### Publishing from Google Sheets

1. `File → Share → Publish to web`
2. Choose the sheet that contains the bank, format **CSV**.
3. Hit **Publish** and copy the link – it will look like `https://docs.google.com/spreadsheets/d/{spreadsheetId}/pub?...`.
4. Paste that URL in the app. The loader automatically converts it to the CSV export endpoint.

### Review vs. Highlight sheets

- Each worksheet inside the published workbook is treated as a standalone question set. Use clear names such as `M06_Review` or `M06_Highlights`.
- If you publish a single sheet (the URL contains `gid=`), AME Mentor loads it immediately.
- If you publish the entire spreadsheet, the app inspects the workbook, lists every sheet it finds, and lets the user pull *all*, *Review only*, *Highlights only*, or any custom combination—no extra configuration required.
- This makes it easy to keep Review traps and Book Highlight callouts in the same Google Sheet while still giving students a focused experience.

## Gh-Pages deployment

The repo ships with `gh-pages` so you can host the quiz as a static site:

```bash
npm run build                   # local build (base is set to './' for GH Pages)
npm run deploy                  # pushes dist/ to the gh-pages branch
```

The Vite config uses a relative base, so it will work under `https://{user}.github.io/{repo}` without extra tweaks.

## Project structure

```
src/
 ├─ components/            # Configurator, learning mode, exam mode, summary
 ├─ utils/                 # CSV ingestion + analytics helper
 ├─ types.ts               # Shared quiz types
 └─ App.tsx                # High-level state orchestration
public/sample-question-bank.csv  # Ready-to-use example data
```

## Ideas & next steps

- Add spaced repetition scoring so difficult prompts surface more often.
- Persist recent sessions locally so progress survives refreshes.
- Let's not forget to nudge the user to create their own question bank based on our schema (builds ownership)
- Support inline editing / manual question entry for last-minute drills.
- All quiz caching for offline experience
- UI to show different list of quizzes available based on default Google SpreadSheet database
- Since quiz exam prep is by module then understanding analysis should be based on Sub Modules with in that module

Contributions welcome—open an issue with the scenario you have in mind. ✈️
