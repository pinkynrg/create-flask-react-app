import fs from 'fs-extra';
import path from 'path';
import { input, confirm } from '@inquirer/prompts';
import slugify from 'slugify';
import { exec } from 'child_process';
import PackageJson from '@npmcli/package-json'
import ora from 'ora'

// Constants for directory paths
const TEMPLATE_DIR = path.join(__dirname, '../template');
const CURRENT_DIR = process.cwd();

/**
 * Normalize a string to a slug (lowercase, hyphenated)
 * @param {string} str - The string to normalize.
 * @returns {string} - The normalized string.
 */
const normalizeString = (str: string): string => slugify(str, { lower: true, strict: true });

/**
 * Prompt the user for input with optional normalization.
 * @param {Object} data - The input data for the prompt.
 * @param {string} data.message - The message to display to the user.
 * @param {boolean} [data.normalize=false] - Whether to normalize the input.
 * @param {string} [data.defaultValue] - The default value for the input.
 * @param {boolean} [data.required=false] - Whether the input is required.
 * @returns {Promise<string>} - The user's input, possibly normalized.
 */
const askForInput = async (data: {
  message: string;
  normalize?: boolean;
  defaultValue?: string;
  required?: boolean;
}): Promise<string> => {
  const { message, normalize = false, required = false, defaultValue } = data;
  const answerRaw: string = await input({ message: `${message}:`, default: defaultValue, required });

  if (!normalize) {
    return answerRaw;
  }

  const answer: string = normalizeString(answerRaw);

  if (answerRaw !== answer) {
    const isOk: boolean = await confirm({ default: true, message: `${message} will be ${answer}:` });
    if (!isOk) {
      return askForInput(data);
    }
  }

  return answer;
};

/**
 * Run a shell command in a specified directory.
 * @param {string} command - The command to run.
 * @param {string} errorMessage - The error message to display if the command fails.
 * @param {Object} options - Options for execSync, such as cwd and stdio.
 */
const runCommand = (command: string, options: { cwd: string, output?: boolean }, errorMessage?: string): Promise<void> => {
  const spinner = ora(`Running: ${command}`).start();

  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        spinner.fail(errorMessage ? `Failed: ${command} - ${errorMessage}` : `Failed: ${command}`);
        reject(error);  // Reject the promise with the error
        return;
      }
      spinner.succeed(`Completed: ${command}`);
      // if (!!options.output) {
        // console.log(stdout)
      // }
      resolve();  // Resolve the promise successfully
    });
  });
};
/**
 * Move files from one directory to another, preserving existing files.
 * @param {string} sourceDir - The source directory.
 * @param {string} destDir - The destination directory.
 */
const moveFilesPreserveExisting = (sourceDir: string, destDir: string): void => {
  fs.copySync(sourceDir, destDir, { overwrite: false, errorOnExist: false });
  fs.removeSync(sourceDir); // Optionally remove the source directory after copying
};

/**
 * Print an empty line to the console.
 */
const nextLine = (): void => console.log('');

/**
 * Replace placeholders in a file's content with actual values.
 * @param {string} content - The file content with placeholders.
 * @param {Object} replacements - An object with keys as placeholders and values as the replacement text.
 * @returns {string} - The content with placeholders replaced.
 */
const replacePlaceholders = (content: string, replacements: { [key: string]: string }): string => {
  return Object.entries(replacements).reduce((updatedContent, [placeholder, value]) => {
    const regex = new RegExp(`{{{${placeholder}}}}`, 'g');
    return updatedContent.replace(regex, value);
  }, content);
};

/**
 * Copy and replace placeholders in all files from source to destination directory.
 * @param {string} sourceDir - The source directory.
 * @param {string} destDir - The destination directory.
 * @param {Object} replacements - An object with keys as placeholders and values as the replacement text.
 */
const copyAndReplacePlaceholders = (sourceDir: string, destDir: string, replacements: { [key: string]: string }): void => {
  fs.ensureDirSync(destDir);

  fs.readdirSync(sourceDir).forEach((file) => {
    const sourceFilePath = path.join(sourceDir, file);
    const destFilePath = path.join(destDir, file);

    if (fs.statSync(sourceFilePath).isDirectory()) {
      copyAndReplacePlaceholders(sourceFilePath, destFilePath, replacements);
    } else {
      let content = fs.readFileSync(sourceFilePath, 'utf-8');
      content = replacePlaceholders(content, replacements);
      fs.writeFileSync(destFilePath, content);
    }
  });
};

/**
 * Main function to generate a new project with the specified configurations.
 */
async function generate(): Promise<void> {
  // Check required commands are installed
  await runCommand('docker --version', { cwd: CURRENT_DIR, output: true }, 'Docker is required to be installed');
  await runCommand('poetry --version', { cwd: CURRENT_DIR, output: true }, 'Poetry is required to be installed');
  await runCommand('pyenv --version', { cwd: CURRENT_DIR, output: true }, 'Pyenv is required to be installed');
  await runCommand('npm --version', { cwd: CURRENT_DIR, output: true }), 'NPM is required to be installed';

  // check docker daemon is running
  await runCommand('docker ps', { cwd: CURRENT_DIR, output: true }, 'Docker daemon is required to be running');

  nextLine();

  // Gather project information from the user
  const userInput = {
    serverPort: '5000',
    serverHost: '127.0.0.1',
    projectName: await askForInput({ message: 'Project name', normalize: true, defaultValue: 'myProject' }),
    projectDescription: await askForInput({ message: 'Project description' }),
    author: await askForInput({ message: 'Author' }),
    postgresHost: '127.0.0.1',
    postgresUser: await askForInput({ message: 'Postgresql username', defaultValue: 'root' }),
    postgresPassword: await askForInput({ message: 'Postgresql password', defaultValue: 'root' }),
    postgresDatabase: await askForInput({ message: 'Postgresql database name', defaultValue: 'db' }),
    // dockerHubRegistryName: await askForInput({ message: 'DockerHub registry name' }),
    // dockerHubLoginToken: await askForInput({ message: 'DockerHub login token' }),
  }

  // Set up project directories
  const projectDir: string = path.join(CURRENT_DIR, userInput.projectName);
  const serverDir: string = path.join(projectDir, 'server');
  const clientDir: string = path.join(projectDir, 'client');
  const temporaryClientDir: string = path.join(CURRENT_DIR, userInput.projectName, userInput.projectName);

  // Copy files from template directory, replacing placeholders
  copyAndReplacePlaceholders(TEMPLATE_DIR, projectDir, userInput);

  // Install Python dependencies using Poetry
  await runCommand('poetry install', { cwd: serverDir });

  // Create a new Vite project with React and TypeScript
  await runCommand(`npm create vite@latest ${userInput.projectName} -- --template react-ts`, { cwd: projectDir });
  
  // Move files from temporaryClientDir to clientDir, preserving existing files
  moveFilesPreserveExisting(temporaryClientDir, clientDir);

  // Load the existing package.json
  const pkgJson = await PackageJson.load(clientDir);

  // Update the package.json
  pkgJson.update({
    dependencies: {
      ...(pkgJson.content.dependencies || {}),
      'axios': '^1.7.4',
      'moment': '^2.30.1',
    },
    devDependencies: {
      ...(pkgJson.content.devDependencies || {}),
      'eslint-plugin-prefer-arrow': '^1.2.3',
      '@types/node': '^22.4.1',
      'eslint': '^8.51.0',
    },
    scripts: {
      ...pkgJson.content.scripts,
      'lint': 'eslint **/*.{ts,tsx}',
    },
  });

  pkgJson.save()

  // Install npm packages
  await runCommand(`npm install`, { cwd: clientDir });

  // Install Airbnb ESLint config
  await runCommand('npx install-peerdeps --dev eslint-config-airbnb', { cwd: clientDir })
  await runCommand('npm uninstall @eslint/js', { cwd: clientDir })  
  await runCommand('rm eslint.config.js', { cwd: clientDir })

  // create .gitignore file
  const gitignore = `
db_data
.DS_Store
node_modules
__pycache__
client/dist
.env
`

  fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignore);

  console.log(`Project ${userInput.projectName} created successfully.`);
}

// Run the generate function to start the process
generate();
