import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROBLEMS } from './problems.js';
import { EXAMS, getExamWithProblems } from './exams.js';
import { runJava, judgeProblem } from './executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

let submissions = [];
let proctorLogs = {}; // examId -> userId -> logs[]
let examSessions = {}; // sessionId -> { examId, userId, start, violations }

// API: Problems - supports pagination, search, filter (for 1000 easy)
app.get('/api/problems', (req, res) => {
  const { search, difficulty, category, page, limit } = req.query;
  let filtered = [...PROBLEMS];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.id.toLowerCase().includes(s));
  }
  if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
  if (category) filtered = filtered.filter(p => p.category === category);
  const total = filtered.length;
  // pagination
  const pg = Math.max(1, parseInt(page) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(limit) || 50));
  const start = (pg - 1) * lim;
  const paged = filtered.slice(start, start + lim).map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, category: p.category, proctored: !!p.proctored }));
  // if pagination params present, return envelope
  if (req.query.page || req.query.limit) {
    return res.json({ total, page: pg, limit: lim, totalPages: Math.ceil(total / lim), problems: paged });
  }
  // backward compat: return array (but include paged slice if total > 200? return all for legacy - but cap at 200 to avoid huge payload)
  if (total > 200 && !req.query.page) {
    return res.json({ total, problems: paged, note: 'Use ?page=1&limit=50 for pagination. Total 1008 problems available.' });
  }
  res.json(paged);
});

app.get('/api/problems/count', (req, res) => {
  const easy = PROBLEMS.filter(p=>p.difficulty==='Easy').length;
  res.json({ total: PROBLEMS.length, easy, proctored: PROBLEMS.filter(p=>p.proctored).length, categories: [...new Set(PROBLEMS.map(p=>p.category))] });
});

app.get('/api/problems/:id', (req, res) => {
  const p = PROBLEMS.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Problem not found' });
  res.json(p);
});

// API: Exams
app.get('/api/exams', (req, res) => {
  res.json(EXAMS.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    durationMins: e.durationMins,
    totalMarks: e.totalMarks,
    proctoring: e.proctoring,
    problemCount: e.problemIds.length,
    createdBy: e.createdBy
  })));
});

app.get('/api/exams/:id', (req, res) => {
  const exam = getExamWithProblems(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
});

app.post('/api/exams', (req, res) => {
  const { title, description, durationMins, problemIds, proctoring } = req.body;
  if (!title || !problemIds || !problemIds.length) return res.status(400).json({ error: 'title and problemIds required' });
  const id = 'exam-' + Date.now();
  const exam = {
    id,
    title,
    description: description || '',
    durationMins: durationMins || 30,
    totalMarks: problemIds.length * 25,
    passingMarks: Math.round(problemIds.length * 25 * 0.4),
    proctoring: !!proctoring,
    problemIds,
    createdBy: 'Admin',
    instructions: ['Webcam monitoring enabled', 'Do not switch tabs']
  };
  EXAMS.push(exam);
  res.json(exam);
});

// API: Run (single stdin)
app.post('/api/run', async (req, res) => {
  const { code, stdin } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const result = await runJava(code, stdin || '');
  res.json(result);
});

// API: Submit (judge problem)
app.post('/api/submit', async (req, res) => {
  const { code, problemId, examId, userId } = req.body;
  if (!code || !problemId) return res.status(400).json({ error: 'code and problemId required' });
  const problem = PROBLEMS.find(p => p.id === problemId);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const judged = await judgeProblem(code, problem);
  const submission = {
    id: Date.now().toString(),
    problemId,
    examId: examId || null,
    userId: userId || 'anonymous',
    code: code.slice(0, 8000),
    verdict: judged.verdict,
    score: judged.score,
    passed: judged.passed,
    total: judged.total,
    results: judged.results,
    mocked: judged.mocked,
    timestamp: new Date().toISOString()
  };
  submissions.unshift(submission);
  if (submissions.length > 100) submissions = submissions.slice(0, 100);
  res.json(submission);
});

// API: Exam submit all (aggregate)
app.post('/api/exam-submit', (req, res) => {
  const { examId, userId, answers, proctorSummary } = req.body;
  const exam = getExamWithProblems(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  // answers: [{problemId, verdict, score}]
  const totalScore = (answers || []).reduce((s, a) => s + (a.score || 0), 0);
  const avgScore = answers && answers.length ? Math.round(totalScore / answers.length) : 0;
  const passed = avgScore >= 40;
  const record = {
    id: Date.now().toString(),
    examId,
    userId: userId || 'student',
    answers: answers || [],
    totalScore,
    avgScore,
    passed,
    proctorSummary: proctorSummary || null,
    timestamp: new Date().toISOString(),
    flagged: proctorSummary && proctorSummary.violations >= 3
  };
  submissions.unshift({ ...record, type: 'exam' });
  res.json(record);
});

app.get('/api/submissions', (req, res) => {
  res.json(submissions.slice(0, 50));
});

// API: Proctoring
app.post('/api/proctor/log', (req, res) => {
  const { examId, userId, event, details, timestamp } = req.body;
  if (!examId || !event) return res.status(400).json({ error: 'examId and event required' });
  const key = `${examId}:${userId || 'anon'}`;
  if (!proctorLogs[key]) proctorLogs[key] = [];
  proctorLogs[key].push({ event, details: details || '', timestamp: timestamp || new Date().toISOString() });
  if (proctorLogs[key].length > 200) proctorLogs[key] = proctorLogs[key].slice(-200);
  console.log(`[PROCTOR] ${examId} ${userId} ${event} ${details || ''}`);
  res.json({ ok: true, count: proctorLogs[key].length });
});

app.get('/api/proctor/report/:examId', (req, res) => {
  const examId = req.params.examId;
  const userId = req.query.userId;
  if (userId) {
    const key = `${examId}:${userId}`;
    const logs = proctorLogs[key] || [];
    const exam = EXAMS.find(e=>e.id===examId);
    return res.json({ examId, examTitle: exam?.title || examId, userId, total: logs.length, flagged: logs.length>=3, logs });
  }
  const filtered = Object.entries(proctorLogs)
    .filter(([k]) => k.startsWith(examId + ':'))
    .map(([k, logs]) => ({ key: k, userId: k.split(':')[1], count: logs.length, flagged: logs.length>=3, logs: logs.slice(-30) }));
  res.json({ examId, examTitle: EXAMS.find(e=>e.id===examId)?.title || examId, reports: filtered });
});

// Download report with user name in filename and inside file
app.get('/api/proctor/download/:examId', (req, res) => {
  const examId = req.params.examId;
  const userId = req.query.userId;
  const format = (req.query.format || 'csv').toLowerCase();
  if (!userId) return res.status(400).json({ error: 'userId query required (?userId=YourName)' });
  const key = `${examId}:${userId}`;
  const logs = proctorLogs[key] || [];
  const exam = EXAMS.find(e=>e.id===examId);
  const examTitle = exam ? exam.title : examId;
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40) || 'anon';
  const safeExam = examId.replace(/[^a-zA-Z0-9_-]/g,'_');
  const date = new Date().toISOString().slice(0,10);
  const flagged = logs.length >= 3;
  if (format === 'json') {
    const payload = {
      studentName: userId,
      examId, examTitle,
      generatedAt: new Date().toISOString(),
      totalViolations: logs.length,
      flagged,
      proctorSummary: `${logs.length} violation(s)${flagged?' - FLAGGED FOR REVIEW':''}`,
      logs
    };
    res.setHeader('Content-Disposition', `attachment; filename="ProctorReport_${safeExam}_${safeUser}_${date}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(payload, null, 2));
  }
  // CSV default
  const header = ['Student Name','Exam ID','Exam Title','Timestamp','Event','Details','Flagged'];
  const rows = logs.length ? logs.map(l => [
    `"${userId.replace(/"/g,'""')}"`,
    examId, `"${examTitle.replace(/"/g,'""')}"`,
    l.timestamp, l.event, `"${(l.details||'').replace(/"/g,'""')}"`,
    flagged?'YES':'NO'
  ].join(',')) : [`"${userId}",${examId},"${examTitle}",,,,"NO"`];
  // prepend summary rows
  const summary = [
    `Student Name,${userId}`,
    `Exam ID,${examId}`,
    `Exam Title,"${examTitle}"`,
    `Generated At,${new Date().toISOString()}`,
    `Total Violations,${logs.length}`,
    `Flagged,${flagged ? 'YES - REVIEW REQUIRED' : 'NO'}`,
    ``,
    header.join(',')
  ].join('\n');
  const csv = summary + '\n' + rows.join('\n');
  res.setHeader('Content-Disposition', `attachment; filename="ProctorReport_${safeExam}_${safeUser}_${date}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csv);
});

// List all reports for a specific user across exams (who did proctor)
app.get('/api/proctor/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const entries = Object.entries(proctorLogs)
    .filter(([k]) => k.endsWith(':'+userId))
    .map(([k, logs]) => {
      const examId = k.split(':')[0];
      const exam = EXAMS.find(e=>e.id===examId);
      return { examId, examTitle: exam?.title || examId, count: logs.length, flagged: logs.length>=3, last: logs[logs.length-1]?.timestamp || null, logs: logs.slice(-10) };
    });
  res.json({ userId, totalExams: entries.length, totalViolations: entries.reduce((s,e)=>s+e.count,0), reports: entries });
});

app.get('/api/proctor/status', (req, res) => {
  res.json({ totalLogs: Object.keys(proctorLogs).length, sessions: Object.keys(examSessions).length });
});

// Fallback: serve frontend for SPA
app.get('/exam', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/exam.html'));
});

app.listen(PORT, () => {
  console.log(`Online Exam Proctoring Portal running at http://localhost:${PORT}`);
  console.log(`Exams: ${EXAMS.length}, Problems: ${PROBLEMS.length}`);
  import('child_process').then(cp => {
    try { cp.execSync('javac -version', { stdio: 'ignore' }); console.log('JDK detected: real Java compilation enabled'); }
    catch { console.log('JDK NOT found: running in MOCK mode (install default-jdk for real execution)'); }
  });
});
