#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../tests');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));

console.log('Available test suites:');
files.forEach((f, i) => {
  console.log(`${i + 1}. ${f}`);
});

const prompt = require('readline-sync');
const choice = prompt.question('Enter test number to run (or 0 for all): ');

if (choice === '0') {
  execSync('npx playwright test', { stdio: 'inherit' });
} else {
  const idx = parseInt(choice, 10) - 1;
  if (idx >= 0 && idx < files.length) {
    execSync(`npx playwright test tests/${files[idx]}`, { stdio: 'inherit' });
  } else {
    console.log('Invalid choice.');
  }
}
