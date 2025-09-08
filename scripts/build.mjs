import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

function run(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: 'inherit', ...options });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} (exit ${code})`));
    });
    child.on('error', reject);
  });
}

function getBuildId() {
  try {
    const out = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    if (out.status === 0) {
      const sha = String(out.stdout || '').trim();
      if (sha) return sha;
    }
  } catch {}
  // Fallback to timestamp YYYYMMDDHHmmss
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return ts;
}

function listHtmlFiles(dir) {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const p = join(current, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && extname(p) === '.html') results.push(p);
    }
  }
  return results;
}

function stampHtml(html, buildId) {
  // Replace or append ?v= for specific, non-hashed assets
  const stamp = (pattern) => html.replace(pattern, (m, p1) => `${p1}?v=${buildId}`);
  // Ensure we don't double-append: normalize to base before stamping
  const normalize = (pattern) => html.replace(pattern, (m, p1) => p1);

  // Normalize existing version params for our targets
  html = normalize(/(\/favicon\.png)(?:\?v=[^"'\s]*)/g);
  html = normalize(/(\/favicon\.ico)(?:\?v=[^"'\s]*)/g);
  html = normalize(/(\/apple-touch-icon\.png)(?:\?v=[^"'\s]*)/g);
  html = normalize(/(\/brand\/[A-Za-z0-9_\-\.]+\.png)(?:\?v=[^"'\s]*)/g);
  html = normalize(/(\/planets\/[A-Za-z0-9_\-\.]+\.png)(?:\?v=[^"'\s]*)/g);

  // Stamp fresh version
  html = stamp(/(\/favicon\.png)(?:\?v=[^"'\s]*)?/g);
  html = stamp(/(\/favicon\.ico)(?:\?v=[^"'\s]*)?/g);
  html = stamp(/(\/apple-touch-icon\.png)(?:\?v=[^"'\s]*)?/g);
  html = stamp(/(\/brand\/[A-Za-z0-9_\-\.]+\.png)(?:\?v=[^"'\s]*)?/g);
  html = stamp(/(\/planets\/[A-Za-z0-9_\-\.]+\.png)(?:\?v=[^"'\s]*)?/g);

  return html;
}


async function main() {
  const buildId = getBuildId();
  const env = { ...process.env, VITE_BUILD_ID: buildId };

  // TypeScript project references build
  await run('tsc -b', { env });
  // Vite build with env for embedding the build id into JS/HTML where used
  await run('vite build', { env });

  // Post-build stamp for copied static HTML under dist/
  const distDir = 'dist';
  const files = listHtmlFiles(distDir);
  for (const f of files) {
    try {
      const before = readFileSync(f, 'utf8');
      const after = stampHtml(before, buildId);
      if (after !== before) writeFileSync(f, after, 'utf8');
    } catch {}
  }

  // NOTE: Do NOT mutate hashed JS under /assets/* post-build. That breaks content hashing.

  console.log(`[build] Completed with BUILD_ID=${buildId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


