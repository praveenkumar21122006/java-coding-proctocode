# ProctoCode - Online Java Exam with Proctoring

Automated testing portal for **Java coding questions** integrated with **webcam motion / face detection** monitoring.

Live: `http://localhost:3000` after `npm start`

## Features
- **Java Auto-Judging**: **1008 problems (1000 Easy proctored + 8 manual)** - generated via `backend/generate_java_easy.cjs:1` (59 templates × variants). Compiles with `javac` + `java` (5s timeout). Mock fallback if JDK missing. Hidden tests masked, verdicts: Accepted / Wrong Answer / Compilation Error / Time Limit.
- **Exam Management**: **13 exams** - 10 proctored batches `exam-java-easy-proctored-1..10` (100 Qs each, 90 mins, proctoring=true) covering all 1000 Easy, plus 3 legacy (midterm/final proctored, practice unproctored). Create custom proctored exam via Admin UI (search + paginated 1000 selection, duration, proctor toggle).
- **Monaco Editor** (VS Code) with Java template, Run (custom stdin) & Submit per problem, per-test table.
- **Proctoring Engine** (`frontend/js/proctor.js:1`):
  - Webcam mandatory pre-check + live preview with overlay
  - Face detection: native `FaceDetector` API if available, else lightweight fallback (brightness heuristic). Detects **NO_FACE**, **MULTIPLE_FACES**, **FACE_NOT_CENTERED**
  - Motion detection: canvas frame-diff (160x120) at 700ms, threshold 25% -> `MOTION_DETECTED`
  - Tab switch: `visibilitychange` + `blur` -> `TAB_SWITCH`
  - Fullscreen enforcement + exit logging -> `FULLSCREEN_EXIT`
  - Copy/paste/cut disabled & logged -> `COPY_PASTE`
  - Snapshot capture, violation counter, auto-flag if >=3 violations
  - All violations `POST /api/proctor/log` (view via Reports)
- **Timer & Auto-submit**, local persistence of code, exam summary report.
- **Downloadable Proctor Reports (personalized with name)** (`backend/server.js:178`): `GET /api/proctor/download/:examId?userId=Alice&format=csv/json` returns `Content-Disposition: attachment; filename="ProctorReport_<exam>_<Alice>_<date>.csv"` with CSV header `Student Name,Alice / Exam Title,... / Flagged`. Dashboard `frontend/index.html:62` has “Download My Proctor Report” (auto-fills login name) + instructor cards with per-user ⬇️ buttons; exam `frontend/exam.html:59` shows violation bar + result modal with ⬇️ CSV/JSON for that student. `GET /api/proctor/user/:userId` aggregates across exams.

## Quick Start
```bash
npm install
npm start
# open http://localhost:3000
# For real Java: sudo apt install default-jdk
```

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exams | List exams |
| GET | /api/exams/:id | Exam + problems |
| POST | /api/exams | Create exam |
| GET | /api/problems?page=1&limit=50&search=&category=&difficulty= | Paginated list (1008) |
| GET | /api/problems/count | Counts: total/easy/proctored/categories |
| GET | /api/problems/:id | Problem detail (supports `java-easy-0001`..`1000`) |
| POST | /api/run | `{code, stdin}` run |
| POST | /api/submit | `{code, problemId, examId, userId}` judge |
| POST | /api/exam-submit | Aggregate exam submit |
| POST | /api/proctor/log | `{examId,userId,event,details}` |
| GET | /api/proctor/report/:examId?userId= | Violations (with examTitle) |
| GET | /api/proctor/download/:examId?userId=&format=csv/json | **Download report with user name** in filename & CSV header (`ProctorReport_<examId>_<user>_date.csv`) |
| GET | /api/proctor/user/:userId | All exams violations for a user (personalized) |

## Architecture
```
frontend/
  index.html      Dashboard + exam grid + proctor reports
  exam.html       Exam taking: Monaco + problems + webcam + violations
  js/proctor.js   Face/motion/tab/fullscreen engine
  css/style.css
backend/
  server.js       Express API + static (pagination for 1000)
  executor.js     Java compile/run + judge (mock fallback)
  problems.js     Loads 1008 (MANUAL 8 + 1000 from problems_java_easy.json) with proctored flag
  problems_java_easy.json  1000 Easy generated (1.4MB)
  generate_java_easy.cjs   Generator for 1000
  exams.js        13 exams (10×100Q proctored batches)
```

## Production Hardening
- Replace mock with Docker-isolated JDK, seccomp, no network, memory limits
- Load `face-api.js` models for accurate detection: `faceapi.nets.tinyFaceDetector.loadFromUri('/models')`
- Persist to DB (Postgres), add JWT auth, rate-limit, BullMQ queue, webcam snapshot upload (S3)
- Teacher dashboard for proctor review + code plagiarism check

## Deploy (Docker)
```dockerfile
FROM node:20
RUN apt-get update && apt-get install -y default-jdk
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm","start"]
```
