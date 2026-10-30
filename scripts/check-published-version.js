import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const publishPaths = [
  'src/',
  'bin/',
  'templates/',
  'README.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
];
const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

if (!stagedFiles.some((file) => publishPaths.some((path) => file === path || file.startsWith(path)))) {
  process.exit(0);
}

const { name, version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const result = spawnSync('npm', ['view', `${name}@${version}`, 'version'], {
  encoding: 'utf8',
});

if (result.status === 0) {
  console.error(
    `\n${name}@${version} is already published. Bump the version in package.json and package-lock.json before committing release-related changes.`
  );
  process.exit(1);
}

if (/E404|404 Not Found/.test(result.stderr)) {
  process.exit(0);
}

console.error(
  'Could not verify the package version against the npm registry. Check your network connection and try committing again.'
);
if (result.stderr) console.error(result.stderr.trim());
process.exit(1);
