const fs = require('fs');
const path = require('path');

function isPrime(n){ if(n<2) return false; for(let i=2;i*i<=n;i++) if(n%i===0) return false; return true; }
function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return Math.abs(a); }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
function fib(n){ if(n<=1) return n; let a=0,b=1; for(let i=2;i<=n;i++){ let c=a+b;a=b;b=c;} return b; }
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }

const templates = [
  { base: "Add Two Numbers - Java", desc: v => `Given two integers A and B, print their sum. (Java placement practice #${v+1})`, inputFmt: "Two integers A B", outputFmt: "A+B", gen: (v, idx) => { const a = 10 + v*3 + idx*7, b = 5 + v*2 + idx; return {input:`${a} ${b}`, output:String(a+b)} } },
  { base: "Subtract Two Numbers", desc: v => `Given two integers A and B, print A-B.`, inputFmt: "Two integers A B", outputFmt: "A-B", gen: (v,idx)=>{ const a=50+v*4+idx, b=20+v+idx*2; return {input:`${a} ${b}`, output:String(a-b)}} },
  { base: "Multiply Two Numbers", desc: v=>`Given two integers A and B, print product.`, inputFmt:"Two integers A B", outputFmt:"A*B", gen:(v,idx)=>{const a=3+v%10+idx, b=4+v%7+idx*2; return {input:`${a} ${b}`, output:String(a*b)}} },
  { base: "Division Quotient", desc: v=>`Given two integers A and B (B!=0), print integer quotient A/B (floor).`, inputFmt:"A B", outputFmt:"A/B", gen:(v,idx)=>{const b=2+(v%5)+1, a=b*(5+idx+v%10); return {input:`${a} ${b}`, output:String(Math.floor(a/b))}} },
  { base: "Remainder Operation", desc: v=>`Given A and B, print A % B.`, inputFmt:"A B", outputFmt:"A % B", gen:(v,idx)=>{const b=3+v%6+2, a= 20+v*2+idx*3; return {input:`${a} ${b}`, output:String(a%b)}} },
  { base: "Check Even or Odd", desc: v=>`Given integer N, print "EVEN" if even else "ODD".`, inputFmt:"Integer N", outputFmt:"EVEN or ODD", gen:(v,idx)=>{const n= v*2+idx+7; return {input:`${n}`, output: n%2===0?"EVEN":"ODD"}} },
  { base: "Positive Negative Zero", desc: v=>`Given integer N, print "Positive", "Negative" or "Zero".`, inputFmt:"N", outputFmt:"String", gen:(v,idx)=>{const vals=[-5,0,7, -12, 15]; const n=vals[(v+idx)%5]; const o=n>0?"Positive":n<0?"Negative":"Zero"; return {input:`${n}`, output:o}} },
  { base: "Largest of Two Numbers", desc: v=>`Given two integers, print the larger. If equal print either.`, inputFmt:"A B", outputFmt:"max(A,B)", gen:(v,idx)=>{const a=10+v+idx*3, b=12+v*2+idx; return {input:`${a} ${b}`, output:String(Math.max(a,b))}} },
  { base: "Largest of Three Numbers", desc: v=>`Given three integers A B C, print the largest.`, inputFmt:"A B C", outputFmt:"max", gen:(v,idx)=>{const a=5+v+idx, b=8+v*2+idx*2, c=6+v+idx*3; return {input:`${a} ${b} ${c}`, output:String(Math.max(a,b,c))}} },
  { base: "Leap Year Check", desc: v=>`Given year Y, print "YES" if leap year else "NO". Leap if divisible by 400 or divisible by 4 and not by 100.`, inputFmt:"Y", outputFmt:"YES/NO", gen:(v,idx)=>{const years=[2000,1900,2024,2023,2016]; const y=years[(v+idx)%5]; const leap=(y%400===0)|| (y%4===0 && y%100!==0); return {input:`${y}`, output:leap?"YES":"NO"}} },
  { base: "Vowel or Consonant", desc: v=>`Given a lowercase alphabet character, print "Vowel" if a,e,i,o,u else "Consonant".`, inputFmt:"char", outputFmt:"Vowel/Consonant", gen:(v,idx)=>{const chars=['a','b','e','z','i','k','o','m']; const c=chars[(v+idx)%8]; const isV='aeiou'.includes(c); return {input:c, output:isV?"Vowel":"Consonant"}} },
  { base: "Swap Two Numbers", desc: v=>`Given two integers A B, print them swapped as "B A".`, inputFmt:"A B", outputFmt:"B A", gen:(v,idx)=>{const a=10+v+idx, b=20+v*2+idx; return {input:`${a} ${b}`, output:`${b} ${a}`}} },
  { base: "Area of Circle", desc: v=>`Given radius R (integer), print floor of area = floor(pi*R*R) using pi=3.14 (use Math.floor).`, inputFmt:"R", outputFmt:"floor area", gen:(v,idx)=>{const r=2+v%10+idx%5; return {input:`${r}`, output:String(Math.floor(3.14*r*r))}} },
  { base: "Area of Rectangle", desc: v=>`Given length L and breadth B, print area.`, inputFmt:"L B", outputFmt:"L*B", gen:(v,idx)=>{const l=4+v%10+idx, b=5+v%8+idx; return {input:`${l} ${b}`, output:String(l*b)}} },
  { base: "Simple Interest", desc: v=>`Given P R T, print Simple Interest = (P*R*T)/100 (integer division).`, inputFmt:"P R T", outputFmt:"SI", gen:(v,idx)=>{const p=1000+v*100+idx*50, r=5+v%5, t=2+idx%3; return {input:`${p} ${r} ${t}`, output:String(Math.floor(p*r*t/100))}} },
  { base: "Celsius to Fahrenheit", desc: v=>`Given Celsius C (integer), print Fahrenheit = floor(C*9/5 + 32).`, inputFmt:"C", outputFmt:"F", gen:(v,idx)=>{const c= v*3+idx*2; return {input:`${c}`, output:String(Math.floor(c*9/5+32))}} },
  { base: "Prime Check", desc: v=>`Given N, print "YES" if prime else "NO".`, inputFmt:"N", outputFmt:"YES/NO", gen:(v,idx)=>{const nums=[2,3,4,9,17,20,97,100]; const n=nums[(v+idx)%8]; return {input:`${n}`, output:isPrime(n)?"YES":"NO"}} },
  { base: "Factorial Small", desc: v=>`Given N (0<=N<=10), print N! .`, inputFmt:"N", outputFmt:"factorial", gen:(v,idx)=>{const n=(v+idx)%11; return {input:`${n}`, output:String(factorial(n))}} },
  { base: "Sum of N Natural Numbers", desc: v=>`Given N, print sum 1..N.`, inputFmt:"N", outputFmt:"sum", gen:(v,idx)=>{const n=5+v%20+idx; return {input:`${n}`, output:String(n*(n+1)/2)}} },
  { base: "Sum of Digits", desc: v=>`Given integer N, print sum of its digits (absolute).`, inputFmt:"N", outputFmt:"digit sum", gen:(v,idx)=>{const n= 100+v*13+idx*7; const s=String(Math.abs(n)).split('').reduce((a,c)=>a+Number(c),0); return {input:`${n}`, output:String(s)}} },
  { base: "Reverse Number", desc: v=>`Given integer N, print its reverse (drop leading zeros). Keep sign.`, inputFmt:"N", outputFmt:"reversed", gen:(v,idx)=>{const n= 123+v*11+idx*17; const rev= Number(String(n).split('').reverse().join('')); return {input:`${n}`, output:String(rev)}} },
  { base: "Palindrome Number", desc: v=>`Given integer N, print "YES" if palindrome else "NO".`, inputFmt:"N", outputFmt:"YES/NO", gen:(v,idx)=>{const nums=[121,123,1331,12321,1234,0,7,1221]; const n=nums[(v+idx)%8]; const s=String(n); return {input:`${n}`, output:s===s.split('').reverse().join('')?"YES":"NO"}} },
  { base: "Count Digits", desc: v=>`Given N, print number of digits.`, inputFmt:"N", outputFmt:"count", gen:(v,idx)=>{const n= Math.pow(10, (v+idx)%6)+ (v*7+idx); return {input:`${n}`, output:String(String(n).length)}} },
  { base: "Power a^b", desc: v=>`Given A and B (0<=B<=10), print A^B.`, inputFmt:"A B", outputFmt:"pow", gen:(v,idx)=>{const a=2+v%5+idx%3, b=3+v%4; return {input:`${a} ${b}`, output:String(Math.pow(a,b))}} },
  { base: "GCD of Two Numbers", desc: v=>`Given A B, print GCD.`, inputFmt:"A B", outputFmt:"gcd", gen:(v,idx)=>{const a=12+v*2+idx*3, b=18+v*3+idx*2; return {input:`${a} ${b}`, output:String(gcd(a,b))}} },
  { base: "LCM of Two Numbers", desc: v=>`Given A B, print LCM.`, inputFmt:"A B", outputFmt:"lcm", gen:(v,idx)=>{const a=4+v%6+2, b=6+v%5+3; return {input:`${a} ${b}`, output:String(lcm(a,b))}} },
  { base: "Fibonacci Nth", desc: v=>`Given N (0-indexed), print Nth Fibonacci (F0=0,F1=1).`, inputFmt:"N", outputFmt:"fib", gen:(v,idx)=>{const n= (v+idx)%12; return {input:`${n}`, output:String(fib(n))}} },
  { base: "Sum of Array", desc: v=>`Given N and array of N integers, print sum.`, inputFmt:"N\\narray", outputFmt:"sum", gen:(v,idx)=>{ const n=3+(v+idx)%5; const arr=Array.from({length:n},(_,k)=> 5+v+k*2+idx); const sum=arr.reduce((a,b)=>a+b,0); return {input:`${n}\n${arr.join(' ')}`, output:String(sum)} } },
  { base: "Average of Array Floor", desc: v=>`Given N and array, print floor average.`, inputFmt:"N\\narray", outputFmt:"avg", gen:(v,idx)=>{ const n=3+(v+idx)%4+2; const arr=Array.from({length:n},(_,k)=> 10+v+k*3+idx); const avg=Math.floor(arr.reduce((a,b)=>a+b,0)/n); return {input:`${n}\n${arr.join(' ')}`, output:String(avg)} } },
  { base: "Max in Array", desc: v=>`Given N and array, print maximum.`, inputFmt:"N\\narray", outputFmt:"max", gen:(v,idx)=>{ const n=4+(v+idx)%5; const arr=Array.from({length:n},(_,k)=> (v*3+idx*5+k*7)%100); return {input:`${n}\n${arr.join(' ')}`, output:String(Math.max(...arr))} } },
  { base: "Min in Array", desc: v=>`Given N and array, print minimum.`, inputFmt:"N\\narray", outputFmt:"min", gen:(v,idx)=>{ const n=4+(v+idx)%5; const arr=Array.from({length:n},(_,k)=> (v*7+idx*11+k*13)%100); return {input:`${n}\n${arr.join(' ')}`, output:String(Math.min(...arr))} } },
  { base: "Count Even Odd in Array", desc: v=>`Given N and array, print "evenCount oddCount".`, inputFmt:"N\\narray", outputFmt:"two ints", gen:(v,idx)=>{ const n=5+(v+idx)%5; const arr=Array.from({length:n},(_,k)=> (v+idx+k)%20); const even=arr.filter(x=>x%2===0).length; return {input:`${n}\n${arr.join(' ')}`, output:`${even} ${n-even}`} } },
  { base: "Reverse Array Print", desc: v=>`Given N and array, print reversed array space separated.`, inputFmt:"N\\narray", outputFmt:"reversed", gen:(v,idx)=>{ const n=3+(v+idx)%5+1; const arr=Array.from({length:n},(_,k)=> 1+v+k+idx); return {input:`${n}\n${arr.join(' ')}`, output:arr.slice().reverse().join(' ')} } },
  { base: "Linear Search Presence", desc: v=>`Given N, array and target X, print "YES" if X present else "NO".`, inputFmt:"N\\narray\\nX", outputFmt:"YES/NO", gen:(v,idx)=>{ const n=5; const arr=Array.from({length:n},(_,k)=> 10+v+k*2+idx); const target = (v+idx)%2===0? arr[2] : 9999; return {input:`${n}\n${arr.join(' ')}\n${target}`, output: arr.includes(target)?"YES":"NO"} } },
  { base: "Second Largest", desc: v=>`Given N and array, print second largest distinct element. If not exists print -1.`, inputFmt:"N\\narray", outputFmt:"second max", gen:(v,idx)=>{ const n=5+(v+idx)%3; const arr=Array.from({length:n},(_,k)=> (v*2+idx*3+k*5)%50); const uniq=[...new Set(arr)].sort((a,b)=>b-a); const out= uniq.length>=2? String(uniq[1]): "-1"; return {input:`${n}\n${arr.join(' ')}`, output:out} } },
  { base: "Frequency of Element", desc: v=>`Given N, array and X, print count of X.`, inputFmt:"N\\narray\\nX", outputFmt:"count", gen:(v,idx)=>{ const n=6; const arr=[1,2,2,3,2,4].map(x=> x + (v%2)); const x=2+(v%2); const c=arr.filter(y=>y===x).length; return {input:`${n}\n${arr.join(' ')}\n${x}`, output:String(c)} } },
  { base: "String Length", desc: v=>`Given string S (no spaces), print its length.`, inputFmt:"S", outputFmt:"len", gen:(v,idx)=>{const strs=["hello","java","placement","easy","code"]; const s=strs[(v+idx)%5]+ (v%3===0?"123":""); return {input:s, output:String(s.length)}} },
  { base: "Reverse String", desc: v=>`Given string S, print its reverse.`, inputFmt:"S", outputFmt:"reversed", gen:(v,idx)=>{const base=["hello","world","java","code","abcde"]; const s=base[(v+idx)%5]+String(v%10); return {input:s, output:s.split('').reverse().join('')}} },
  { base: "Palindrome String", desc: v=>`Given string S (lowercase), print "YES" if palindrome else "NO" (case sensitive).`, inputFmt:"S", outputFmt:"YES/NO", gen:(v,idx)=>{const pals=["madam","hello","racecar","java","level"]; const s=pals[(v+idx)%5]; return {input:s, output: s===s.split('').reverse().join('')?"YES":"NO"}} },
  { base: "Count Vowels", desc: v=>`Given string S (lowercase), print count of vowels a,e,i,o,u.`, inputFmt:"S", outputFmt:"count", gen:(v,idx)=>{const s=["hello world","java programming","aeiou","bcdfg","placement"][ (v+idx)%5]; return {input:s, output:String((s.match(/[aeiou]/g)||[]).length)}} },
  { base: "Count Words", desc: v=>`Given line S, print number of words (split by space).`, inputFmt:"line", outputFmt:"count", gen:(v,idx)=>{const lines=["hello world","java is easy","one","a b c d e","placement preparation"]; const s=lines[(v+idx)%5]; return {input:s, output:String(s.trim().split(/\s+/).length)}} },
  { base: "Anagram Check", desc: v=>`Given two strings A and B (lowercase, no spaces), print "YES" if anagrams else "NO".`, inputFmt:"A\\nB", outputFmt:"YES/NO", gen:(v,idx)=>{ const pairs=[["listen","silent"],["hello","world"],["abc","cab"],["java","avaj"],["test","tset"]]; const [a,b]=pairs[(v+idx)%5]; const isAn = a.split('').sort().join('')===b.split('').sort().join(''); return {input:`${a}\n${b}`, output:isAn?"YES":"NO"} } },
  { base: "Toggle Case", desc: v=>`Given string S, toggle case (lower->upper, upper->lower).`, inputFmt:"S", outputFmt:"toggled", gen:(v,idx)=>{const s=["Hello","JaVa","CoDe","ABCdef","Placement"][ (v+idx)%5]; const togg=s.split('').map(c=> c===c.toLowerCase()?c.toUpperCase():c.toLowerCase()).join(''); return {input:s, output:togg}} },
  { base: "Remove Spaces", desc: v=>`Given string with spaces, print string without spaces.`, inputFmt:"line", outputFmt:"no spaces", gen:(v,idx)=>{const s=["hello world","java programming","a b c","placement easy","code judge"][ (v+idx)%5]; return {input:s, output:s.replace(/\s+/g,'')}} },
  { base: "Concatenate Strings", desc: v=>`Given two strings A and B, print A+B.`, inputFmt:"A\\nB", outputFmt:"A+B", gen:(v,idx)=>{const a=["hello","java","code"][ (v+idx)%3]; const b=["world","easy","judge"][ (v+idx)%3]; return {input:`${a}\n${b}`, output:a+b}} },
  { base: "Substring Check", desc: v=>`Given strings S and T, print "YES" if T is substring of S else "NO".`, inputFmt:"S\\nT", outputFmt:"YES/NO", gen:(v,idx)=>{ const pairs=[["helloworld","world"],["java","va"],["placement","place"],["abc","d"],["code","cod"]]; const [s,t]=pairs[(v+idx)%5]; return {input:`${s}\n${t}`, output:s.includes(t)?"YES":"NO"} } },
  { base: "Char Frequency", desc: v=>`Given string S and char C, print count of C in S.`, inputFmt:"S\\nC", outputFmt:"count", gen:(v,idx)=>{const s=["hello","java","placement","mississippi","banana"][ (v+idx)%5]; const c=["l","a","e","s","a"][ (v+idx)%5]; return {input:`${s}\n${c}`, output:String(s.split(c).length-1)}} },
  { base: "First Non Repeating", desc: v=>`Given string S, print first non-repeating character else "-1".`, inputFmt:"S", outputFmt:"char or -1", gen:(v,idx)=>{ const s=["swiss","hello","aabbccde","java","abcabc"][ (v+idx)%5]; let ans="-1"; const freq={}; for(let ch of s) freq[ch]=(freq[ch]||0)+1; for(let ch of s) if(freq[ch]===1){ans=ch;break;} return {input:s, output:ans} } },
  { base: "Compare Strings Equal", desc: v=>`Given two strings A B, print "YES" if equal else "NO".`, inputFmt:"A\\nB", outputFmt:"YES/NO", gen:(v,idx)=>{const a=["hello","java","test"][ (v+idx)%3]; const b= (v+idx)%2===0? a : a+"x"; return {input:`${a}\n${b}`, output:a===b?"YES":"NO"}} },
  { base: "Sum Even Numbers up to N", desc: v=>`Given N, print sum of even numbers from 1 to N.`, inputFmt:"N", outputFmt:"sum", gen:(v,idx)=>{const n=10+v%20+idx; let sum=0; for(let i=2;i<=n;i+=2) sum+=i; return {input:`${n}`, output:String(sum)}} },
  { base: "Sum Odd Numbers up to N", desc: v=>`Given N, print sum of odd numbers 1..N.`, inputFmt:"N", outputFmt:"sum", gen:(v,idx)=>{const n=11+v%20+idx; let sum=0; for(let i=1;i<=n;i+=2) sum+=i; return {input:`${n}`, output:String(sum)}} },
  { base: "Print Natural Numbers", desc: v=>`Given N, print numbers 1 to N space separated.`, inputFmt:"N", outputFmt:"1..N", gen:(v,idx)=>{const n=5+v%5+1+idx%3; const arr=Array.from({length:n},(_,k)=>k+1).join(' '); return {input:`${n}`, output:arr}} },
  { base: "Table of N", desc: v=>`Given N, print its multiplication table 1..10 each on new line as "N x i = result".`, inputFmt:"N", outputFmt:"10 lines", gen:(v,idx)=>{const n=2+v%8+1; const out=Array.from({length:10},(_,k)=> `${n} x ${k+1} = ${n*(k+1)}`).join('\n'); return {input:`${n}`, output:out}} },
  { base: "Hollow Square Pattern Check", desc: v=>`Given N, print N x N square of "*". Each row stars without spaces.`, inputFmt:"N", outputFmt:"pattern", gen:(v,idx)=>{const n=3+(v+idx)%3; const row="*".repeat(n); const out=Array(n).fill(row).join('\n'); return {input:`${n}`, output:out}} },
  { base: "Right Triangle Stars", desc: v=>`Given N, print right triangle: row i has i stars.`, inputFmt:"N", outputFmt:"pattern", gen:(v,idx)=>{const n=3+(v+idx)%4+1; const out=Array.from({length:n},(_,k)=> "*".repeat(k+1)).join('\n'); return {input:`${n}`, output:out}} },
  { base: "Number Triangle", desc: v=>`Given N, print: row i prints 1..i space separated.`, inputFmt:"N", outputFmt:"pattern", gen:(v,idx)=>{const n=3+(v+idx)%3+2; const out=Array.from({length:n},(_,k)=> Array.from({length:k+1},(_,j)=>j+1).join(' ')).join('\n'); return {input:`${n}`, output:out}} },
  { base: "Check Sorted Array", desc: v=>`Given N and array, print "YES" if strictly increasing else "NO".`, inputFmt:"N\\narray", outputFmt:"YES/NO", gen:(v,idx)=>{ const sorted = (v+idx)%2===0; const n=5; let arr; if(sorted) arr=[1,2,3,4,5].map(x=>x+v); else arr=[5,1,3,2,4]; return {input:`${n}\n${arr.join(' ')}`, output: sorted?"YES":"NO"} } },
  { base: "Missing Number 1..N", desc: v=>`Given N and array of N-1 numbers from 1..N with one missing, find missing.`, inputFmt:"N\\narray", outputFmt:"missing", gen:(v,idx)=>{ const n=5+(v+idx)%5+1; const miss= 1+ (v+idx)%n; const arr=[]; for(let i=1;i<=n;i++) if(i!==miss) arr.push(i); return {input:`${n}\n${arr.join(' ')}`, output:String(miss)} } },
  { base: "Duplicate Count", desc: v=>`Given N and array, print count of distinct duplicates (value appearing >1).`, inputFmt:"N\\narray", outputFmt:"count", gen:(v,idx)=>{ const arr=[1,2,2,3,3,3,4].slice(0,5+(v+idx)%3); const freq={}; arr.forEach(x=>freq[x]=(freq[x]||0)+1); const dup=Object.values(freq).filter(c=>c>1).length; return {input:`${arr.length}\n${arr.join(' ')}`, output:String(dup)} } },
];

const TOTAL = 1000;
const javaTemplate = `import java.util.*;
public class Main{
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        // Write your code here - read from stdin and print output
        // Example: read two ints and print sum
        // if(sc.hasNextInt()){ int a=sc.nextInt(); int b=sc.nextInt(); System.out.println(a+b); }
        sc.close();
    }
}
`;

function makeProblem(idx){
  const tmpl = templates[idx % templates.length];
  const variant = Math.floor(idx / templates.length);
  const seq = idx+1;
  const testCases = [];
  for(let k=0;k<5;k++){
    const t = tmpl.gen(variant, k + variant*2);
    testCases.push({input:t.input, output:t.output, hidden: k>=2});
  }
  const samples = testCases.slice(0,2).map(tc=>({input:tc.input, output:tc.output}));
  const title = `${tmpl.base} #${variant+1}`;
  return {
    id: `java-easy-${String(seq).padStart(4,'0')}`,
    title,
    difficulty: "Easy",
    language: "java",
    category: "Placement - Java Easy",
    description: tmpl.desc(variant),
    inputFormat: tmpl.inputFmt,
    outputFormat: tmpl.outputFmt,
    constraints: "1 <= N <= 10^5, Time 1s, Memory 256MB",
    samples,
    testCases,
    starter: { java: javaTemplate }
  };
}

const problems=[];
for(let i=0;i<TOTAL;i++) problems.push(makeProblem(i));

const outPath = path.join(__dirname, 'problems_java_easy.json');
fs.writeFileSync(outPath, JSON.stringify(problems, null, 2));
console.log(`Generated ${problems.length} problems -> ${outPath}`);
console.log(`First: ${problems[0].id} - ${problems[0].title}`);
console.log(`Last: ${problems[problems.length-1].id} - ${problems[problems.length-1].title}`);
