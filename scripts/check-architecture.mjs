import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['manaseek-api/src', 'manaseek-mobile/src', 'manaseek-ui/src', 'packages/shared'];
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const normalize = path => relative(root, path).replaceAll('\\', '/');
function walk(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(folder, entry.name);
    return entry.isDirectory() ? walk(path) : extensions.includes(extname(path)) && !path.endsWith('.d.ts') ? [path] : [];
  });
}
const files = roots.flatMap(folder => walk(resolve(root, folder)));
const known = new Set(files);
const edges = new Map();
const issues = [];
for (const file of files) {
  const name = normalize(file);
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]|\b(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map(match => match[1] ?? match[2]);
  const targets = [];
  for (const specifier of imports) {
    let base;
    if (specifier.startsWith('.')) base = resolve(dirname(file), specifier);
    else if (specifier.startsWith('@/') && name.startsWith('manaseek-api/')) base = resolve(root, 'manaseek-api/src', specifier.slice(2));
    const target = base && [base, ...extensions.map(ext => base + ext), ...extensions.map(ext => resolve(base, `index${ext}`))]
      .find(path => existsSync(path) && statSync(path).isFile());
    const targetName = target ? normalize(target) : specifier;
    if (target && known.has(target)) targets.push(target);
    if (name.startsWith('packages/shared/') && !targetName.startsWith('packages/shared/')) {
      issues.push(`${name}: shared logic must stay platform-independent (${specifier})`);
    }
    if (name.startsWith('manaseek-api/src/common/') && targetName.startsWith('manaseek-api/src/modules/')) {
      issues.push(`${name}: common infrastructure cannot depend on a feature module (${specifier})`);
    }
    if (name.endsWith('/chat/chat.service.ts') && /openrouter|config.service/.test(specifier)) {
      issues.push(`${name}: application flow must depend on the AI port, not vendor/configuration details`);
    }
    if (name === 'manaseek-mobile/src/screens/ChatScreen.tsx' && /\/lib\/(api|storage|secure)$/.test(specifier)) {
      issues.push(`${name}: chat view must delegate I/O to its feature layer`);
    }
    if (name.startsWith('manaseek-api/src/common/access/') && !specifier.startsWith('.')) {
      issues.push(`${name}: access policies must not depend on framework or database packages`);
    }
  }
  edges.set(file, targets);
}

// Static source-import graph, including type imports. Not a runtime/module-loader
// proof: computed imports and dependency-package internals are outside this check.
const visited = new Set();
const active = new Set();
function visit(file, trail = []) {
  if (active.has(file)) {
    issues.push(`Import cycle: ${[...trail.slice(trail.indexOf(file)), file].map(normalize).join(' -> ')}`);
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of edges.get(file) ?? []) visit(target, [...trail, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file);
if (issues.length) {
  console.error([...new Set(issues)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Architecture checks passed: ${files.length} source files, no static import cycles or protected-boundary violations.`);
}
