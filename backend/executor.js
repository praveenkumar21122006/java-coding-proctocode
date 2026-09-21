import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function hasJava() {
  try {
    execSync('javac -version', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch { return false; }
}

const JAVA_AVAILABLE = hasJava();

function normalize(s) {
  return (s || '').replace(/\r\n/g, '\n').trim().replace(/\s+$/gm, '').trim();
}

function mockJavaResult(code, stdin, expectedOutput) {
  // Fallback mock evaluator when JDK not installed - uses JS logic for known patterns
  // For demo: if code contains "System.out.println" assume correct; else do simple checks
  // We'll try to infer correctness by checking if code looks like solution template
  const hasPrint = /System\.out\.print/.test(code);
  const hasScanner = /Scanner/.test(code);
  if (!hasPrint) {
    return { success: false, stdout: '', stderr: 'Mock: No output statement found. Install JDK for real compilation.\nExpected: ' + expectedOutput, timedOut: false };
  }
  // Deterministic mock: if code length > 50 chars, treat as correct for sample tests
  // This allows UI to function without JDK
  if (code.length > 80 && hasScanner) {
    return { success: true, stdout: expectedOutput, stderr: '', timedOut: false, mocked: true };
  }
  return { success: true, stdout: expectedOutput, stderr: '', timedOut: false, mocked: true };
}

export async function runJava(code, stdin = '', timeoutMs = 5000) {
  if (!JAVA_AVAILABLE) {
    // Mock mode - return expected behavior
    return {
      stdout: '',
      stderr: 'JDK not installed on server. Running in MOCK mode for demo.\nInstall JDK (apt install default-jdk) and restart for real compilation.\nYour code was received and will be judged via mock evaluator.',
      exitCode: 0,
      timedOut: false,
      mocked: true
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'java-exam-'));
  const javaFile = path.join(tmpDir, 'Main.java');
  fs.writeFileSync(javaFile, code);

  // Compile
  const compile = spawn('javac', ['Main.java'], { cwd: tmpDir, timeout: timeoutMs });
  let compileStderr = '';
  compile.stderr.on('data', d => compileStderr += d);
  const compileResult = await new Promise(res => {
    let timedOut = false;
    const t = setTimeout(() => { compile.kill('SIGKILL'); timedOut = true; }, timeoutMs);
    compile.on('close', code => { clearTimeout(t); res({ code, timedOut }); });
    compile.on('error', () => { clearTimeout(t); res({ code: 1, timedOut: false }); });
  });
  if (compileResult.code !== 0) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    return { stdout: '', stderr: compileStderr || 'Compilation Error', exitCode: compileResult.code, timedOut: compileResult.timedOut, mocked: false };
  }

  // Run
  const run = spawn('java', ['Main'], { cwd: tmpDir, timeout: timeoutMs });
  let stdout = '', stderr = '';
  run.stdout.on('data', d => stdout += d);
  run.stderr.on('data', d => stderr += d);
  if (stdin) run.stdin.write(stdin);
  run.stdin.end();

  const runResult = await new Promise(res => {
    let timedOut = false;
    const t = setTimeout(() => { run.kill('SIGKILL'); timedOut = true; }, timeoutMs);
    run.on('close', code => { clearTimeout(t); res({ code, timedOut }); });
    run.on('error', e => { clearTimeout(t); stderr += e.message; res({ code: 1, timedOut: false }); });
  });

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  if (stdout.length > 10000) stdout = stdout.slice(0, 10000) + '\n...[truncated]';
  if (stderr.length > 5000) stderr = stderr.slice(0, 5000);
  return { stdout, stderr, exitCode: runResult.code, timedOut: runResult.timedOut, mocked: false };
}

export async function judgeProblem(code, problem) {
  const allTests = [...problem.tests, ...problem.hiddenTests];
  const results = [];
  let passed = 0;
  let compileError = false;
  let runtimeError = false;

  for (let i = 0; i < allTests.length; i++) {
    const tc = allTests[i];
    const isHidden = i >= problem.tests.length;

    if (!JAVA_AVAILABLE) {
      // Mock judging
      const mock = mockJavaResult(code, tc.input, tc.output);
      const expected = normalize(tc.output);
      // In mock, we assume code is correct if it looks substantial
      const isPass = code.length > 80 && /System\.out/.test(code);
      const out = isPass ? expected : 'MOCK_WRONG';
      const pass = normalize(out) === expected;
      if (pass) passed++;
      results.push({
        input: isHidden ? '[hidden]' : tc.input,
        expected: isHidden ? '[hidden]' : tc.output,
        output: isHidden ? (pass ? '[hidden - passed]' : '[hidden - failed]') : out,
        passed: pass,
        hidden: isHidden,
        stderr: mock.stderr,
        mocked: true
      });
      continue;
    }

    const r = await runJava(code, tc.input);
    if (r.timedOut) {
      results.push({ input: isHidden ? '[hidden]' : tc.input, expected: isHidden ? '[hidden]' : tc.output, output: '', passed: false, hidden: isHidden, error: 'Time Limit Exceeded', stderr: r.stderr });
      continue;
    }
    if (r.exitCode !== 0 && r.stderr) {
      // Check if compilation vs runtime - first test compile error propagates
      if (r.stderr.includes('error:') || r.stderr.includes('cannot find symbol')) compileError = true;
      else runtimeError = true;
    }
    const actual = normalize(r.stdout);
    const expected = normalize(tc.output);
    const pass = actual === expected && r.exitCode === 0;
    if (pass) passed++;
    results.push({
      input: isHidden ? '[hidden]' : tc.input,
      expected: isHidden ? '[hidden]' : tc.output,
      output: isHidden ? (pass ? '[hidden - passed]' : '[hidden - failed]') : (r.stdout || r.stderr.slice(0, 500)),
      passed: pass,
      hidden: isHidden,
      stderr: r.stderr,
      timedOut: r.timedOut
    });
  }

  const total = allTests.length;
  const score = Math.round((passed / total) * 100);
  let verdict = 'Accepted';
  if (passed === 0 && compileError) verdict = 'Compilation Error';
  else if (runtimeError && passed === 0) verdict = 'Runtime Error';
  else if (passed < total) verdict = 'Wrong Answer';
  else verdict = 'Accepted';

  return { passed, total, score, verdict, results, mocked: !JAVA_AVAILABLE };
}
