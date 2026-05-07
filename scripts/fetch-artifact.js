// Usage: node scripts/fetch-artifact.js <owner> <repo> <workflow_name> <artifact_name> <github_token>
// Example: node scripts/fetch-artifact.js chaitussm Banking_Application dev-pipeline.yml frontend-build ${{ secrets.BANKING_APP_TOKEN }}

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function fetchLatestWorkflowRun(owner, repo, workflow, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?status=success&per_page=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch workflow runs: ${res.statusText}`);
  const data = await res.json();
  if (!data.workflow_runs || !data.workflow_runs.length) throw new Error('No successful workflow runs found');
  return data.workflow_runs[0].id;
}

async function fetchArtifactId(owner, repo, runId, artifactName, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch artifacts: ${res.statusText}`);
  const data = await res.json();
  const artifact = data.artifacts.find(a => a.name === artifactName);
  if (!artifact) throw new Error(`Artifact ${artifactName} not found`);
  return artifact.id;
}

async function downloadArtifact(owner, repo, artifactId, token, outDir) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to download artifact: ${res.statusText}`);
  const dest = path.join(outDir, 'artifact.zip');
  const fileStream = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
  return dest;
}

async function main() {
  const [owner, repo, workflow, artifactName, token] = process.argv.slice(2);
  if (!owner || !repo || !workflow || !artifactName || !token) {
    console.error('Usage: node scripts/fetch-artifact.js <owner> <repo> <workflow_name> <artifact_name> <github_token>');
    process.exit(1);
  }
  const outDir = path.resolve(__dirname, '../', artifactName);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const runId = await fetchLatestWorkflowRun(owner, repo, workflow, token);
  const artifactId = await fetchArtifactId(owner, repo, runId, artifactName, token);
  const zipPath = await downloadArtifact(owner, repo, artifactId, token, outDir);
  // Unzip
  const unzip = require('unzipper');
  await fs.createReadStream(zipPath).pipe(unzip.Extract({ path: outDir })).promise();
  fs.unlinkSync(zipPath);
  console.log(`Artifact ${artifactName} downloaded and extracted to ${outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
