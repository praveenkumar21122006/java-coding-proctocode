import { PROBLEMS } from './problems.js';

const GENERATED_IDS = PROBLEMS.filter(p=>p.id.startsWith('java-easy-')).map(p=>p.id);

// Auto-create 10 proctored easy batches covering 1000 questions (100 each)
const BATCH_EXAMS = [];
for(let b=0;b<10;b++){
  const start=b*100;
  const ids=GENERATED_IDS.slice(start, start+100);
  if(ids.length){
    BATCH_EXAMS.push({
      id: `exam-java-easy-proctored-${b+1}`,
      title: `Java Easy Proctored Batch ${b+1} - 100 Qs`,
      description: `Proctored exam - 100 Easy Java questions (Q ${start+1}-${start+ids.length}). Face + motion monitoring enforced.`,
      durationMins: 90,
      totalMarks: 100,
      passingMarks: 40,
      proctoring: true,
      problemIds: ids,
      startTime: null,
      endTime: null,
      createdBy: 'Proctor System',
      instructions: [
        'Webcam must remain ON - face detection active',
        'Motion & multiple faces flagged',
        'Tab switch / fullscreen exit logged as violation',
        '3+ violations = flagged for review',
        'Auto-submit on timer end'
      ]
    });
  }
}

export const EXAMS = [
  ...BATCH_EXAMS,
  {
    id: 'exam-java-midterm',
    title: 'Java Coding Midterm - Proctored',
    description: 'Midterm exam covering Strings, Arrays and Math. Proctoring enabled (face + motion detection).',
    durationMins: 45,
    totalMarks: 100,
    passingMarks: 40,
    proctoring: true,
    problemIds: ['java-001', 'java-003', 'java-006', 'java-004'],
    startTime: null,
    endTime: null,
    createdBy: 'Prof. Kumar',
    instructions: [
      'Webcam must remain ON throughout the exam',
      'Do not switch tabs or exit fullscreen - violation will be logged',
      'Face must be clearly visible - multiple faces or no face triggers alert',
      'No copy-paste allowed in editor',
      'Exam auto-submits when timer ends'
    ]
  },
  {
    id: 'exam-java-practice',
    title: 'Java Practice Test (Unproctored)',
    description: 'Practice set for beginners - no proctoring, no time pressure.',
    durationMins: 30,
    totalMarks: 50,
    passingMarks: 20,
    proctoring: false,
    problemIds: ['java-001', 'java-002'],
    startTime: null,
    endTime: null,
    createdBy: 'System',
    instructions: ['Practice mode - proctoring disabled', 'Use this to familiarize with editor']
  },
  {
    id: 'exam-java-final',
    title: 'Java Final Assessment - Proctored',
    description: 'Comprehensive final covering all topics. Strict proctoring with auto-flagging.',
    durationMins: 60,
    totalMarks: 100,
    passingMarks: 50,
    proctoring: true,
    problemIds: ['java-002', 'java-005', 'java-007', 'java-008'],
    startTime: null,
    endTime: null,
    createdBy: 'Prof. Kumar',
    instructions: [
      'Strict proctoring enabled',
      '3+ violations may auto-flag submission for review',
      'Ensure good lighting and stable internet',
      'Keep face centered in webcam preview'
    ]
  }
];

export function getExamWithProblems(id) {
  const exam = EXAMS.find(e => e.id === id);
  if (!exam) return null;
  const problems = exam.problemIds.map(pid => PROBLEMS.find(p => p.id === pid)).filter(Boolean);
  return { ...exam, problems };
}
