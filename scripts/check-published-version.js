import { execFileSync, spawnSync } from 'node:child_process';

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

const stagedPackage = JSON.parse(execFileSync('git', ['show', ':package.json'], { encoding: 'utf8' }));
const stagedLock = JSON.parse(execFileSync('git', ['show', ':package-lock.json'], { encoding: 'utf8' }));
const { name, version } = stagedPackage;
const baseCommit = spawnSync('git', ['merge-base', 'HEAD', 'origin/main'], { encoding: 'utf8' });
const comparisonRef = baseCommit.status === 0 ? baseCommit.stdout.trim() : 'HEAD';
const basePackage = JSON.parse(
  execFileSync('git', ['show', `${comparisonRef}:package.json`], { encoding: 'utf8' })
);

if (
  stagedPackage.version !== stagedLock.version ||
  stagedPackage.version !== stagedLock.packages[''].version
) {
  console.error('The staged versions in package.json and package-lock.json must match.');
  process.exit(1);
}

if (stagedPackage.version === basePackage.version) {
  console.error(
    `\nThe package version has not changed from ${comparisonRef === 'HEAD' ? 'HEAD' : 'the branch base'}. Bump the version in package.json and package-lock.json before committing release-related changes.`
  );
  process.exit(1);
}

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
