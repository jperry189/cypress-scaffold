import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';

const templatesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates');

function cancelIfNeeded(value: string | symbol): string {
  if (typeof value === 'symbol') {
    p.cancel('Operation cancelled.');
    return process.exit(0);
  }
  return value;
}

async function main(): Promise<void> {
  p.intro(chalk.bold('@solirius/create-cypress'));
  const projectName = cancelIfNeeded(
    await p.text({
      message: 'What is your project named?',
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
      message: 'Choose a language',
      options: [
        { value: 'typescript', label: 'TypeScript (recommended)' },
        { value: 'javascript', label: 'JavaScript' },
      ],
    })
  );

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(path.join(templatesDir, language), targetDir, { recursive: true });
  fs.renameSync(path.join(targetDir, 'gitignore'), path.join(targetDir, '.gitignore'));
  const projectPackageJson = path.join(targetDir, 'package.json');
  const projectPackage = JSON.parse(fs.readFileSync(projectPackageJson, 'utf8')) as { name: string };
  projectPackage.name = projectName;
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

await main();
