export const JAVA_CONFIG = {
  fileName: 'Main.java',
  className: 'Main',
  compileCmd: 'javac',
  runCmd: 'java',
  timeoutMs: 5000,
  maxOutput: 10000
};

export const EXAM_CONFIG = {
  defaultDurationMins: 60,
  proctor: {
    faceCheckIntervalMs: 1500,
    motionThreshold: 25,
    noFaceLimit: 3,
    multipleFaceLimit: 2
  }
};
