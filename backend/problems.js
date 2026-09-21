import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load generated 1000 easy proctored problems if available
let GENERATED = [];
try {
  const genPath = path.join(__dirname, 'problems_java_easy.json');
  if (fs.existsSync(genPath)) {
    const raw = JSON.parse(fs.readFileSync(genPath, 'utf8'));
    GENERATED = raw.map(p => {
      // Normalize to unified shape expected by executor & frontend
      const tests = (p.testCases || []).filter(tc => !tc.hidden).map(tc => ({ input: tc.input, output: tc.output }));
      const hiddenTests = (p.testCases || []).filter(tc => tc.hidden).map(tc => ({ input: tc.input, output: tc.output }));
      // fallback sample
      const sample = p.samples ? { input: p.samples[0]?.input || tests[0]?.input, output: p.samples[0]?.output || tests[0]?.output } : (tests[0] || {input:'',output:''});
      return {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty || 'Easy',
        category: p.category || 'Placement - Java Easy',
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: p.constraints,
        sample,
        samples: p.samples || tests.slice(0,2).map(t=>({input:t.input, output:t.output})),
        tests: tests.length ? tests : [{input:'1', output:'1'}],
        hiddenTests: hiddenTests.length ? hiddenTests : [],
        testCases: p.testCases, // keep original
        template: p.starter?.java || p.template || `import java.util.*;\npublic class Main{\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        // Write code\n        sc.close();\n    }\n}`,
        starter: p.starter,
        proctored: true
      };
    });
  }
} catch (e) { console.warn('Failed to load generated problems', e.message); }

// Manual core problems (8)
const MANUAL = [
  {
    id: 'java-001',
    title: 'Reverse a String',
    difficulty: 'Easy',
    category: 'String',
    description: `Write a Java program that reads a single line string and prints its reverse.\nExample: Input: "hello" -> Output: "olleh"`,
    inputFormat: 'Single string (may contain spaces)',
    outputFormat: 'Reversed string',
    constraints: '1 <= length <= 1000',
    sample: { input: 'hello', output: 'olleh' },
    tests: [
      { input: 'hello', output: 'olleh' },
      { input: 'Java', output: 'avaJ' },
      { input: '12345', output: '54321' },
      { input: 'a', output: 'a' }
    ],
    hiddenTests: [
      { input: 'Proctor', output: 'rotcorP' },
      { input: 'racecar', output: 'racecar' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Write your code here - print reverse\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}`
  },
  {
    id: 'java-002',
    title: 'Palindrome Check',
    difficulty: 'Easy',
    category: 'String',
    description: `Check if a given string is a palindrome (ignore case). Print "YES" if palindrome else "NO".`,
    sample: { input: 'Madam', output: 'YES' },
    tests: [
      { input: 'Madam', output: 'YES' },
      { input: 'hello', output: 'NO' },
      { input: 'Racecar', output: 'YES' }
    ],
    hiddenTests: [
      { input: 'Level', output: 'YES' },
      { input: 'Java', output: 'NO' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        String rev = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equalsIgnoreCase(rev) ? "YES" : "NO");\n    }\n}`
  },
  {
    id: 'java-003',
    title: 'Factorial',
    difficulty: 'Easy',
    category: 'Math',
    description: `Given integer n, print its factorial. (0 <= n <= 12 to avoid overflow)\nInput: n\nOutput: n!`,
    sample: { input: '5', output: '120' },
    tests: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '3', output: '6' }
    ],
    hiddenTests: [
      { input: '10', output: '3628800' },
      { input: '1', output: '1' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long fact = 1;\n        for(int i=2;i<=n;i++) fact*=i;\n        System.out.println(fact);\n    }\n}`
  },
  {
    id: 'java-004',
    title: 'Prime Number',
    difficulty: 'Easy',
    category: 'Math',
    description: `Check if number is prime. Print "Prime" or "Not Prime".`,
    sample: { input: '7', output: 'Prime' },
    tests: [
      { input: '7', output: 'Prime' },
      { input: '4', output: 'Not Prime' },
      { input: '2', output: 'Prime' }
    ],
    hiddenTests: [
      { input: '1', output: 'Not Prime' },
      { input: '97', output: 'Prime' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        if(n<2){System.out.println("Not Prime");return;}\n        for(int i=2;i*i<=n;i++) if(n%i==0){System.out.println("Not Prime");return;}\n        System.out.println("Prime");\n    }\n}`
  },
  {
    id: 'java-005',
    title: 'Fibonacci Series',
    difficulty: 'Easy',
    category: 'Math',
    description: `Given n, print first n Fibonacci numbers space-separated (starting 0 1). If n=1 print 0.`,
    sample: { input: '5', output: '0 1 1 2 3' },
    tests: [
      { input: '5', output: '0 1 1 2 3' },
      { input: '1', output: '0' },
      { input: '2', output: '0 1' }
    ],
    hiddenTests: [
      { input: '7', output: '0 1 1 2 3 5 8' },
      { input: '3', output: '0 1 1' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long a=0,b=1;\n        for(int i=0;i<n;i++){\n            if(i==0) System.out.print(a);\n            else if(i==1) System.out.print(" "+b);\n            else { long c=a+b; System.out.print(" "+c); a=b; b=c; }\n            if(i==0 && n>1) { /* handled */ }\n        }\n        // simpler loop\n    }\n}`
  },
  {
    id: 'java-006',
    title: 'Array Sum',
    difficulty: 'Easy',
    category: 'Array',
    description: `First line n, second line n integers. Print sum of array.`,
    sample: { input: '5\\n1 2 3 4 5', output: '15' },
    tests: [
      { input: '5\n1 2 3 4 5', output: '15' },
      { input: '3\n10 20 30', output: '60' }
    ],
    hiddenTests: [
      { input: '1\n100', output: '100' },
      { input: '4\n-1 -2 -3 -4', output: '-10' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long sum=0;\n        for(int i=0;i<n;i++) sum+=sc.nextInt();\n        System.out.println(sum);\n    }\n}`
  },
  {
    id: 'java-007',
    title: 'Largest Element',
    difficulty: 'Easy',
    category: 'Array',
    description: `Find largest element in array. Input: n then n integers. Output: max.`,
    sample: { input: '5\\n3 9 2 8 6', output: '9' },
    tests: [
      { input: '5\n3 9 2 8 6', output: '9' },
      { input: '3\n-5 -1 -3', output: '-1' }
    ],
    hiddenTests: [
      { input: '1\n42', output: '42' },
      { input: '6\n1 1 1 1 1 1', output: '1' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int max = Integer.MIN_VALUE;\n        for(int i=0;i<n;i++) max=Math.max(max, sc.nextInt());\n        System.out.println(max);\n    }\n}`
  },
  {
    id: 'java-008',
    title: 'Anagram Check',
    difficulty: 'Medium',
    category: 'String',
    description: `Given two strings (two lines), check if they are anagrams (case-insensitive, ignore spaces). Print YES/NO.`,
    sample: { input: 'listen\\nsilent', output: 'YES' },
    tests: [
      { input: 'listen\nsilent', output: 'YES' },
      { input: 'hello\nworld', output: 'NO' }
    ],
    hiddenTests: [
      { input: 'Astronomer\nMoon starer', output: 'YES' },
      { input: 'test\ntset ', output: 'YES' }
    ],
    template: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String a = sc.nextLine().replaceAll("\\\\s","").toLowerCase();\n        String b = sc.nextLine().replaceAll("\\\\s","").toLowerCase();\n        char[] ca=a.toCharArray(), cb=b.toCharArray();\n        Arrays.sort(ca); Arrays.sort(cb);\n        System.out.println(Arrays.equals(ca,cb)?"YES":"NO");\n    }\n}`
  }
];

export const PROBLEMS = [...MANUAL, ...GENERATED];
