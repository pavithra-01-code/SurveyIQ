# Aetram Group — Enterprise Assessment & Survey Platform

Premium enterprise-grade frontend for Interview Survey & Aptitude Assessment (HTML5, CSS3, JavaScript, jQuery, AJAX).

## Design Theme

- Matte Black background
- Metallic Gold accents
- Glassmorphism UI
- Typography: Poppins, Montserrat, Inter

## Project Structure

```
├── index.html                 # Login & Signup (Candidate / Admin)
├── admin-dashboard.html       # Creator, Candidate, Assessment management
├── create-assessment.html     # 7-step assessment builder
├── candidate-instructions.html# Terms & pre-assessment
├── candidate-test.html        # Proctored test interface
├── feedback.html              # Post-assessment feedback
├── analytics-dashboard.html   # KPIs, charts, live leaderboard
├── reports.html               # PDF / Excel / CSV exports
├── css/
│   ├── global.css
│   ├── auth.css
│   ├── admin-dashboard.css
│   ├── candidate.css
│   ├── create-assessment.css
│   └── analytics.css
├── js/
│   ├── global.js
│   ├── auth.js
│   ├── admin-dashboard.js
│   ├── candidate.js
│   ├── create-assessment.js
│   └── analytics.js
└── data/
    ├── sample-data.json
    └── question-bank.csv
```

## Quick Start

Serve the folder with any static server (required for JSON data loading):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080/index.html`

## User Flows

### Admin
1. `index.html` → Toggle **Admin** → Sign In
2. `admin-dashboard.html` — manage creators, candidates, assessments
3. **+ Create Assessment** → `create-assessment.html` (7-step wizard)
4. Sidebar → **Analytics Dashboard** / **Reports**

### Candidate
1. `index.html` → **Candidate** → Sign In
2. `candidate-instructions.html` → agree → **Start Assessment**
3. `candidate-test.html` — fullscreen proctoring, timer, auto-save
4. `feedback.html` → success → home

## Demo Credentials

Any valid email + password works (client-side validation). Session stored in `sessionStorage`.

## Backend Integration

AJAX placeholders use `AetramAPI.ajax()` in `js/global.js`. When running the backend and frontend from the same origin, set `AetramConfig.baseUrl = '/api'` so requests remain same-origin.

Run the backend from `Assessment/SurveyIQ`:

```powershell
cd "Assessment/SurveyIQ"
dotnet run --urls http://localhost:5071
```

The backend also serves the frontend from the sibling `frontend surveyiq` folder, so once the backend is running you can open:

`http://localhost:5071/index.html`

- Auth endpoints
- Jobs and candidate verification
- Resume parsing and application submission
- Analytics and leaderboard data

Demo admin credentials for backend JWT access:

- `email`: `admin@surveyiq.com`
- `password`: `AdminPass123!`

## Tech Stack (Strict)

- HTML5, CSS3, JavaScript, jQuery, AJAX
- Chart.js (analytics)
- SignalR (simulated; production hub commented in code)

No React, Vue, Angular, Bootstrap, or Tailwind.

© 2026 Aetram Group of Companies. All Rights Reserved.
