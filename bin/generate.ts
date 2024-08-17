import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { input, confirm } from '@inquirer/prompts';
import slugify from 'slugify';
import { execSync } from 'child_process';

const TEMPLATE_DIR = path.join(__dirname, '../template');
const CURRENT_DIR = process.cwd();

const normalizeString = (str: string) => slugify(str, { lower: true, strict: true });

const askForInput = async (data: { message: string, normalize?: boolean, defaultValue?: string }) => {
  const { message, normalize = false, defaultValue = undefined } = data
  const answerRaw = await input({ message: `${message}:`, default: defaultValue });
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
}

const checkIfPoetryExists = () => {
  try {
    execSync('poetry --version', { stdio: 'ignore' });
    console.log('Poetry is installed.');
  } catch (error) {
    console.error('Poetry is not installed. Please install Poetry first: https://python-poetry.org/docs/#installation');
    process.exit(1);
  }
}

const runPoetryInstall = (projectDir: string) => {
  try {
    console.log('Installing dependencies using Poetry...');
    execSync('poetry install', { cwd: projectDir, stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Failed to install dependencies with Poetry.');
    process.exit(1);
  }
}

async function generate() {
  
  const projectName = await askForInput({ message: 'Project name', normalize: true });
  const projectDescription = await askForInput({ message: 'Project description' });
  const author = await askForInput({ message: 'Author' });
  const postgresUser = await askForInput({ message: 'Postgresql useraname', defaultValue: 'root' });
  const postgresPassword = await askForInput({ message: 'Postgresql password', defaultValue: 'root' });
  const postgresDatabase = await askForInput({ message: 'Postgresql database name', defaultValue: 'db' });
  const dockerHubRegistryName = await askForInput({ message: 'DockerHub registry name' });
  const dockerHubLoginToken = await askForInput({ message: 'DockerHub login token' });

  const projectDir = path.join(CURRENT_DIR, projectName);
  fs.mkdirSync(projectDir);

  const templateDir = TEMPLATE_DIR;

  fs.copySync(templateDir, projectDir);

  // Define the content of the .env file
  const envContent = `
PROJECT_NAME=${projectName}
POSTGRES_USER=${postgresUser}
POSTGRES_PASSWORD=${postgresPassword}
POSTGRES_DB=${postgresDatabase}
DOCKER_REGISTRY_NAME=${dockerHubRegistryName}
DOCKER_LOGIN_TOKEN=${dockerHubLoginToken}
`.trim();

  const envFilePath = path.join(projectDir, '.env');
  fs.writeFileSync(envFilePath, envContent);

  const pyProjectContent = `
[tool.poetry]
name = "${projectName}"
version = "0.0.1"
description = "${projectDescription}"
authors = ["${author}"]
readme = "README.md"
package-mode = false

[tool.poetry.dependencies]
python = "^3.12"
flask = "^3.0.3"
sqlalchemy = "^2.0.32"
psycopg2-binary = "^2.9.9"
flask-sqlalchemy = "^3.1.1"
alembic = "^1.13.2"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
`.trim();

  const pyProjectPath = path.join(projectDir, 'pyproject.toml');
  fs.writeFileSync(pyProjectPath, pyProjectContent);

  // Replace placeholders in files
  const filesToRename = fs.readdirSync(projectDir);
  filesToRename.forEach(file => {
    const filePath = path.join(projectDir, file);
    if (fs.lstatSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf8');
      const rendered = ejs.render(content, { projectName });
      fs.writeFileSync(filePath, rendered);
    }
  });

  console.log(`Project ${projectName} created successfully.`);

  // Check if Poetry is installed
  checkIfPoetryExists();

  // Enter the project directory and run `poetry install`
  runPoetryInstall(projectDir);
}

generate();
