import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';

const templatesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates');

function cancelIfNeeded(value: string | symbol): string;
function cancelIfNeeded(value: boolean | symbol): boolean;
function cancelIfNeeded(value: string | boolean | symbol): string | boolean {
  if (typeof value === 'symbol') {
    p.cancel('Operation cancelled.');
    clearNpxCache();
    return process.exit(0);
  }
  return value;
}

// npx caches packages in <npm cache>/_npx and `npm cache clean` doesn't touch it, so remove it
// to make the next `npm init @solirius/cypress` download the latest version.
function clearNpxCache(): void {
  const npmCache = process.env.npm_config_cache ?? path.join(os.homedir(), '.npm');
  try {
    const npxCache = fs.realpathSync(path.join(npmCache, '_npx'));
    if (!templatesDir.startsWith(`${npxCache}${path.sep}`)) return;
    fs.rmSync(npxCache, { recursive: true, force: true });
  } catch {
    // Best effort: a stale cache must never fail a successful scaffold.
  }
}

async function main(): Promise<void> {
  p.intro(chalk.bold('@solirius/create-cypress'));
  p.note(
    [
      '⚠️ Run this command from the root of an existing Git repository.',
      'It creates a new project folder inside that repository; otherwise, it will not appear in the repository’s source control.',
      '',
      '• It creates a ready-to-run Cypress testing project',
      '• Choose between JavaScript or TypeScript (with type checking)',
      '• Add Prettier and ESLint if you want them',
      '• When setup finishes, run "npm run cy:open" to get started',
    ].join('\n'),
    'What this tool does:'
  );
  const projectName = cancelIfNeeded(
    await p.text({
      message: 'What should the new project folder be named?',
      placeholder: 'my-cypress-project',
      defaultValue: 'my-cypress-project',
      validate(value) {
        if (!value?.trim()) return 'Project name is required.';
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(value))
          return 'Use a lowercase npm-compatible name with letters, numbers, dots, underscores, or hyphens.';
      },
    })
  );
  const targetDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(targetDir)) {
    p.log.error(`The target directory already exists: ${targetDir}`);
    process.exitCode = 1;
    return;
  }

  const language = cancelIfNeeded(
    await p.select({
      message: 'Choose a language for your Cypress tests',
      options: [
        { value: 'typescript', label: 'TypeScript — .ts tests + type checking' },
        { value: 'javascript', label: 'JavaScript — .js tests' },
      ],
    })
  );
  const includePrettier = cancelIfNeeded(
    await p.confirm({
      message: 'Add Prettier for code formatting?',
      initialValue: true,
    })
  );
  const includeEslint = cancelIfNeeded(
    await p.confirm({
      message: 'Add ESLint for JavaScript and Cypress checks?',
      initialValue: true,
    })
  );

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(path.join(templatesDir, language), targetDir, { recursive: true });
  fs.renameSync(path.join(targetDir, 'gitignore'), path.join(targetDir, '.gitignore'));
  const projectPackageJson = path.join(targetDir, 'package.json');
  const projectPackage = JSON.parse(fs.readFileSync(projectPackageJson, 'utf8')) as {
    name: string;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  projectPackage.name = projectName;
  if (!includePrettier) {
    delete projectPackage.devDependencies.prettier;
    delete projectPackage.scripts.format;
    delete projectPackage.scripts['format:check'];
    fs.rmSync(path.join(targetDir, '.prettierrc.json'));
  }
  if (!includeEslint) {
    delete projectPackage.devDependencies['@eslint/js'];
    delete projectPackage.devDependencies.eslint;
    delete projectPackage.devDependencies['eslint-plugin-cypress'];
    delete projectPackage.devDependencies['typescript-eslint'];
    delete projectPackage.scripts.lint;
    fs.rmSync(path.join(targetDir, 'eslint.config.mjs'));
  }
  fs.writeFileSync(projectPackageJson, `${JSON.stringify(projectPackage, null, 2)}\n`);
  fs.writeFileSync(path.join(targetDir, '.nvmrc'), `${process.versions.node.split('.')[0]}\n`);

  const spinner = p.spinner();
  spinner.start('Installing project dependencies...');
  try {
    await execa('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
  } catch (error) {
    p.log.error(`Dependency installation failed: ${error instanceof Error ? error.message : String(error)}`);
    p.log.info(`Run "npm install" in ${targetDir} to retry.`);
    process.exitCode = 1;
    return;
  }
  spinner.stop('Dependencies installed');
  const startCommand = `cd ${projectName} && npm run cy:open`;
  p.outro(`Done. Start with ${chalk.cyan(startCommand)}`);
}

try {
  await main();
} finally {
  clearNpxCache();
}
