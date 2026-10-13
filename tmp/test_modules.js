const http = require('http');

async function testAll() {
  const visited = new Set();
  const queue = ['/src/main.tsx', '/src/index.css'];
  const errors = [];
  const valid = [];

  while (queue.length > 0) {
    const p = queue.shift();
    if (visited.has(p)) continue;
    visited.add(p);

    const res = await fetch('http://localhost:3000' + p);
    if (!res.ok) {
      errors.push({ path: p, status: res.status });
      continue;
    }
    valid.push(p);
    const text = await res.text();

    const regex = /(?:from\s+['"]|import\s*\(\s*['"])([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const imp = match[1];
      if (imp.startsWith('/') || imp.startsWith('.')) {
        let full = imp;
        if (imp.startsWith('.')) {
          const dir = p.substring(0, p.lastIndexOf('/'));
          full = new URL(imp, 'http://localhost:3000' + dir + '/').pathname;
        }
        if (!visited.has(full)) {
          queue.push(full);
        }
      }
    }
  }

  console.log('Total visited modules:', visited.size);
  console.log('Errors:', JSON.stringify(errors, null, 2));
}

testAll().catch(console.error);
