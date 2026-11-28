import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const distRoot = path.join(frontendDir, '.test-dist');

fs.rmSync(distRoot, { recursive: true, force: true });

const tscBin = path.join(frontendDir, 'node_modules', '.bin', 'tsc');

execFileSync(tscBin, ['-p', path.join(frontendDir, 'tsconfig.test.cjs.json')], {
  cwd: frontendDir,
  stdio: 'inherit',
});

fs.writeFileSync(path.join(distRoot, 'cjs', 'package.json'), '{"type":"commonjs"}\n');

const testsDir = path.join(frontendDir, 'tests');
const testFiles = fs
  .readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => path.join(testsDir, name));

execFileSync(process.execPath, ['--test', ...testFiles], {
  cwd: frontendDir,
  stdio: 'inherit',
});
