import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { input, confirm } from '@inquirer/prompts';
import slugify from 'slugify';
import { execSync } from 'child_process';

const TEMPLATE_DIR = path.join(__dirname, '../template');
const CURRENT_DIR = process.cwd();

const normalizeString = (str: string) => slugify(str, { lower: true, strict: true });

const askForInput = async (data: { message: string, normalize?: boolean, defaultValue?: string, required?: boolean }) => {
  const { message, normalize = false, required = false, defaultValue = undefined } = data;
  const answerRaw = await input({ message: `${message}:`, default: defaultValue, required });
  if (!normalize) {
    return answerRaw;
  }
  const answer = normalizeString(answerRaw);
  if (answerRaw !== answer) {
    const isOk = await confirm({ default: true, message: `${message} will be ${answer}:` });
    if (!isOk) {
      return askForInput(data);
    }
  }
  return answer;
};

const checkIfCommandExists = (command: string) => {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    console.log(`${command} is installed.`);
  } catch (error) {
    console.error(`${command} is not installed. Please install ${command} first.`);
    process.exit(1);
  }
};

const runCommand = (command: string, options: { cwd: string, stdio: 'inherit' }) => {
  execSync(command, options);
};

const writeEnvFile = (projectDir: string, envData: { [key: string]: string }) => {
  const envContent = Object.entries(envData)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
    .trim();
  const envFilePath = path.join(projectDir, '.env');
  fs.writeFileSync(envFilePath, envContent);
};

const writePyProjectFile = (serverDir: string, pyProjectData: { name: string, description: string, author: string }) => {
  const pyProjectContent = `
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

  const pyProjectPath = path.join(serverDir, 'pyproject.toml');
  fs.writeFileSync(pyProjectPath, pyProjectContent);
};

async function generate() {
  const projectName = await askForInput({ message: 'Project name', normalize: true, required: true });
  const projectDescription = await askForInput({ message: 'Project description' });
  const author = await askForInput({ message: 'Author' });
  const postgresUser = await askForInput({ message: 'Postgresql username', defaultValue: 'root' });
  const postgresPassword = await askForInput({ message: 'Postgresql password', defaultValue: 'root' });
  const postgresDatabase = await askForInput({ message: 'Postgresql database name', defaultValue: 'db' });
  const dockerHubRegistryName = await askForInput({ message: 'DockerHub registry name' });
  const dockerHubLoginToken = await askForInput({ message: 'DockerHub login token' });

  const projectDir = path.join(CURRENT_DIR, projectName);
  const serverDir = path.join(projectDir, 'server');
  const clientDir = path.join(projectDir, 'client');
  const temporaryClientDir = path.join(CURRENT_DIR, projectName, projectName);

  fs.mkdirSync(projectDir);
  fs.copySync(TEMPLATE_DIR, projectDir);
  
  writeEnvFile(projectDir, {
    PROJECT_NAME: projectName,
    POSTGRES_HOST: '127.0.0.1',
    POSTGRES_USER: postgresUser,
    POSTGRES_PASSWORD: postgresPassword,
    POSTGRES_DB: postgresDatabase,
    DOCKER_REGISTRY_NAME: dockerHubRegistryName,
    DOCKER_LOGIN_TOKEN: dockerHubLoginToken
  });

  writePyProjectFile(serverDir, { name: projectName, description: projectDescription, author });

  console.log(`Project ${projectName} created successfully.`);

  checkIfCommandExists('poetry');
  runCommand('poetry install', { cwd: serverDir, stdio: 'inherit' });

  checkIfCommandExists('npm');
  runCommand(`npm create vite@latest ${projectName} -- --template react`, { cwd: projectName, stdio: 'inherit' });
  runCommand(`npm install`, { cwd: temporaryClientDir, stdio: 'inherit' });
  fs.move(temporaryClientDir, clientDir);

}

generate();