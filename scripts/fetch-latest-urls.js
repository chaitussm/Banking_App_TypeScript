// scripts/fetch-latest-urls.js
// Fetches the latest frontend and backend URLs from the most recent GitHub Actions pipeline run and updates .env.local
// Requires: node-fetch (npm install node-fetch@2)

const fs = require('fs');
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.DEV_TOKEN; // Set this in your environment for authentication
const REPO = 'chaitussm/Banking_Application';
const WORKFLOW_NAME = 'Dev Pipeline'; // Adjust if your workflow name is different
const ENV_FILE = '.env.local';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required.');
  process.exit(1);
}

async function getLatestRun() {
  const url = `https://api.github.com/repos/${REPO}/actions/runs?per_page=5`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  const data = await res.json();
  // Find the latest successful run for the workflow
  const run = data.workflow_runs.find(r => r.name === WORKFLOW_NAME && r.conclusion === 'success');
  if (!run) throw new Error('No successful workflow run found.');
  return run;
}

async function getRunLogs(runId) {
  const url = `https://api.github.com/repos/${REPO}/actions/runs/${runId}/logs`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  if (!res.ok) throw new Error('Failed to fetch logs.');
  const buffer = await res.buffer();
  return buffer;
}

function extractUrlsFromLogs(logBuffer) {
  // This is a placeholder. Adjust the regex to match your log output for URLs.
  const logText = logBuffer.toString('utf8');
  const frontendMatch = logText.match(/Frontend URL:\s*(https?:\/\/[^\s]+)/);
  const backendMatch = logText.match(/Backend URL:\s*(https?:\/\/[^\s]+)/);
  return {
    frontend: frontendMatch ? frontendMatch[1] : null,
    backend: backendMatch ? backendMatch[1] : null,
  };
}

function updateEnvFile(urls) {
  let env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  env = env.replace(/BASE_URL=.*/g, `BASE_URL=${urls.frontend}`);
  env = env.replace(/API_URL=.*/g, `API_URL=${urls.backend}`);
  fs.writeFileSync(ENV_FILE, env, 'utf8');
  console.log('Updated .env.local with latest URLs:', urls);
}

(async () => {
  try {
    const run = await getLatestRun();
    const logs = await getRunLogs(run.id);
    const urls = extractUrlsFromLogs(logs);
    if (!urls.frontend || !urls.backend) throw new Error('Could not extract URLs from logs.');
    updateEnvFile(urls);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
