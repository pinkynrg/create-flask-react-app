import fs from 'fs-extra';
import path from 'path';
import { input, confirm } from '@inquirer/prompts';
import slugify from 'slugify';
import { execSync } from 'child_process';

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
 * Check if a command exists on the system by running it.
 * @param {string} command - The command to check.
 */
const checkIfCommandExists = (command: string): void => {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    console.log(`✅ ${command} is installed.`);
  } catch (error: any) {
    console.error(`${command} is not installed. Please install ${command} first.`);
    process.exit(1);
  }
};

/**
 * Run a shell command in a specified directory.
 * @param {string} command - The command to run.
 * @param {Object} options - Options for execSync, such as cwd and stdio.
 */
const runCommand = (command: string, options: { cwd: string; stdio: 'inherit' }): void => {
  execSync(command, options);
};

/**
 * Write a .env file with the provided environment variables.
 * @param {string} projectDir - The directory to write the .env file to.
 * @param {Object} envData - The environment variables to include.
 */
const writeEnvFile = (projectDir: string, envData: { [key: string]: string }): void => {
  const envContent: string = Object.entries(envData)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
    .trim();
  const envFilePath = path.join(projectDir, '.env');
  fs.writeFileSync(envFilePath, envContent);
};

/**
 * Write a pyproject.toml file for a Python project.
 * @param {string} serverDir - The server directory to write the file to.
 * @param {Object} pyProjectData - The data for the pyproject.toml file.
 */
const writePyProjectFile = (serverDir: string, pyProjectData: { name: string; description: string; author: string }): void => {
  const pyProjectContent: string = `
[tool.poetry]
name = "${pyProjectData.name}"
version = "0.0.1"
description = "${pyProjectData.description}"
authors = ["${pyProjectData.author}"]
readme = "README.md"
package-mode = false

[tool.poetry.dependencies]
python = "^3.12"
flask = "^3.0.3"
sqlalchemy = "^2.0.32"
psycopg2-binary = "^2.9.9"
flask-sqlalchemy = "^3.1.1"
alembic = "^1.13.2"
python-dotenv = "^1.0.1"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
  `.trim();

  const pyProjectPath: string = path.join(serverDir, 'pyproject.toml');
  fs.writeFileSync(pyProjectPath, pyProjectContent);
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
 * Main function to generate a new project with the specified configurations.
 */
async function generate(): Promise<void> {
  // Check required commands are installed
  checkIfCommandExists('docker');
  checkIfCommandExists('poetry');
  checkIfCommandExists('npm');

  nextLine();

  // Gather project information from the user
  const projectName: string = await askForInput({ message: 'Project name', normalize: true, required: true });
  const projectDescription: string = await askForInput({ message: 'Project description' });
  const author: string = await askForInput({ message: 'Author' });
  const postgresUser: string = await askForInput({ message: 'Postgresql username', defaultValue: 'root' });
  const postgresPassword: string = await askForInput({ message: 'Postgresql password', defaultValue: 'root' });
  const postgresDatabase: string = await askForInput({ message: 'Postgresql database name', defaultValue: 'db' });
  const dockerHubRegistryName: string = await askForInput({ message: 'DockerHub registry name' });
  const dockerHubLoginToken: string = await askForInput({ message: 'DockerHub login token' });

  // Set up project directories
  const projectDir: string = path.join(CURRENT_DIR, projectName);
  const serverDir: string = path.join(projectDir, 'server');
  const clientDir: string = path.join(projectDir, 'client');
  const temporaryClientDir: string = path.join(CURRENT_DIR, projectName, projectName);

  fs.mkdirSync(projectDir);
  fs.copySync(TEMPLATE_DIR, projectDir);
  
  // Write .env and pyproject.toml files
  writeEnvFile(projectDir, {
    PROJECT_NAME: projectName,
    SERVER_PORT: '5000',
    SERVER_HOST: '127.0.0.1',
    POSTGRES_HOST: '127.0.0.1',
    POSTGRES_USER: postgresUser,
    POSTGRES_PASSWORD: postgresPassword,
    POSTGRES_DB: postgresDatabase,
    DOCKER_REGISTRY_NAME: dockerHubRegistryName,
    DOCKER_LOGIN_TOKEN: dockerHubLoginToken
  });

  writePyProjectFile(serverDir, { name: projectName, description: projectDescription, author });
  
  // Install Python dependencies using Poetry
  runCommand('poetry install', { cwd: serverDir, stdio: 'inherit' });

  // Create a new Vite project with React and TypeScript
  runCommand(`npm create vite@latest ${projectName} -- --template react-ts`, { cwd: projectDir, stdio: 'inherit' });
  
  // Move files from temporaryClientDir to clientDir, preserving existing files
  moveFilesPreserveExisting(temporaryClientDir, clientDir);

  // Install basic npm packages
  runCommand(`npm install`, { cwd: clientDir, stdio: 'inherit' });

  // Install additional useful npm packages
  ['moment', 'axios'].forEach((pkg: string) => {
    runCommand(`npm install ${pkg}`, { cwd: clientDir, stdio: 'inherit' });
  });

  console.log(`Project ${projectName} created successfully.`);
}

// Run the generate function to start the process
generate();
