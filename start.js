#!/usr/bin/env node
/**
 * Pinokio - Setup e Inicialização Inteligente (Node.js)
 * 
 * Script cross-platform para setup automático e inicialização do Pinokio
 * 
 * Uso:
 *   npm start              # Inicia a aplicação (recomendado)
 *   node start.js          # Inicialização com setup
 *   node start.js --help   # Mostra ajuda
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Cores para console
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Logger com cores
 */
const logger = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  separator: (title) => {
    console.log('');
    console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
    console.log('');
  }
};

/**
 * Configurações
 */
const config = {
  projectRoot: __dirname,
  nodeModulesPath: path.join(__dirname, 'node_modules'),
  packageJsonPath: path.join(__dirname, 'package.json'),
  packageLockPath: path.join(__dirname, 'package-lock.json'),
  logFile: path.join(__dirname, 'setup.log'),
  forceInstall: false,
};

/**
 * Log para arquivo
 */
function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(config.logFile, `[${timestamp}] ${message}\n`);
  } catch (err) {
    // Ignorar erros de logging
  }
}

/**
 * Executar comando
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}: ${command} ${args.join(' ')}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Executar comando sincronamente e capturar saída
 */
function runCommandSync(command, args = []) {
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    
    if (result.error) throw result.error;
    return result.stdout.trim();
  } catch (err) {
    return null;
  }
}

/**
 * Verificar se um comando existe
 */
function commandExists(command) {
  const result = runCommandSync(process.platform === 'win32' ? 'where' : 'which', [command]);
  return result !== null;
}

/**
 * Separador visual
 */
function separator(title) {
  logger.separator(title);
  logToFile(title);
}

/**
 * Verificar pré-requisitos
 */
async function checkPrerequisites() {
  separator('Verificando Pré-requisitos');

  const prerequisites = [
    { name: 'Node.js', command: 'node', versionFlag: '--version' },
    { name: 'npm', command: 'npm', versionFlag: '--version' },
  ];

  const missingTools = [];

  for (const tool of prerequisites) {
    if (commandExists(tool.command)) {
      const version = runCommandSync(tool.command, [tool.versionFlag]);
      logger.success(`${tool.name} encontrado: ${version}`);
      logToFile(`${tool.name} encontrado: ${version}`);
    } else {
      logger.error(`${tool.name} não encontrado`);
      missingTools.push(tool.name);
      logToFile(`${tool.name} não encontrado`);
    }
  }

  // Git é opcional
  if (commandExists('git')) {
    const version = runCommandSync('git', ['--version']);
    logger.success(version);
    logToFile(version);
  } else {
    logger.warning('Git não encontrado (opcional mas recomendado)');
    logToFile('Git não encontrado (opcional)');
  }

  if (missingTools.length > 0) {
    console.log('');
    logger.error(`Ferramentas necessárias faltando: ${missingTools.join(', ')}`);
    console.log('');
    console.log('Instruções de instalação:');
    
    if (process.platform === 'darwin') {
      console.log('  macOS (Homebrew): brew install node');
    } else if (process.platform === 'linux') {
      console.log('  Ubuntu/Debian: sudo apt-get update && sudo apt-get install nodejs npm');
      console.log('  Fedora: sudo dnf install nodejs npm');
    } else if (process.platform === 'win32') {
      console.log('  Windows: Baixe de https://nodejs.org/');
    }
    
    console.log('');
    throw new Error('Dependências do sistema não estão instaladas');
  }
}

/**
 * Setup do ambiente
 */
async function setupEnvironment() {
  separator('Configurando Ambiente');

  try {
    process.chdir(config.projectRoot);
    logger.success(`Diretório do projeto: ${process.cwd()}`);
    logToFile(`Diretório do projeto: ${process.cwd()}`);
  } catch (err) {
    throw new Error(`Falha ao mudar para diretório do projeto: ${err.message}`);
  }

  // Detectar SO
  const osType = process.platform === 'darwin' ? 'macOS' : 
                 process.platform === 'linux' ? 'Linux' : 
                 process.platform === 'win32' ? 'Windows' : 'Desconhecido';
  
  logger.info(`Sistema Operacional: ${osType}`);
  logToFile(`Sistema Operacional: ${osType}`);

  // Verificar repositório Git
  if (fs.existsSync(path.join(config.projectRoot, '.git'))) {
    logger.success('Repositório Git detectado');
    logToFile('Repositório Git detectado');
  } else {
    logger.warning('Não é um repositório Git');
    logToFile('Não é um repositório Git');
  }

  // Criar arquivo de log se não existe
  if (!fs.existsSync(config.logFile)) {
    fs.writeFileSync(config.logFile, `[${new Date().toISOString()}] Pinokio Setup Log\n`);
    logger.success(`Arquivo de log criado: setup.log`);
  }
}

/**
 * Verificar e instalar dependências
 */
async function checkDependencies() {
  separator('Verificando Dependências');

  // Verificar package.json
  if (!fs.existsSync(config.packageJsonPath)) {
    throw new Error('package.json não encontrado');
  }

  logger.success('package.json encontrado');
  logToFile('package.json encontrado');

  // Verificar node_modules
  const nodeModulesExists = fs.existsSync(config.nodeModulesPath);

  if (!nodeModulesExists || config.forceInstall) {
    if (config.forceInstall && nodeModulesExists) {
      logger.warning('Removendo node_modules (--force ativado)...');
      logToFile('Removendo node_modules (--force ativado)');
      
      try {
        fs.rmSync(config.nodeModulesPath, { recursive: true, force: true });
        if (fs.existsSync(config.packageLockPath)) {
          fs.unlinkSync(config.packageLockPath);
        }
      } catch (err) {
        logger.warning(`Não foi possível remover node_modules: ${err.message}`);
      }
    }

    if (!nodeModulesExists) {
      logger.warning('node_modules não encontrado');
    }

    console.log('');
    logger.info('Instalando dependências...');
    logToFile('Instalando dependências...');
    console.log('Isso pode levar alguns minutos...\n');

    try {
      await runCommand('npm', ['install']);
      logger.success('Dependências instaladas com sucesso');
      logToFile('Dependências instaladas com sucesso');
    } catch (err) {
      logger.error('Falha ao instalar dependências');
      console.log('');
      console.log('Sugestões de solução:');
      console.log('  1. Verifique sua conexão com a internet');
      console.log('  2. Limpe o cache: npm cache clean --force');
      console.log('  3. Aumente o timeout: npm install --no-audit --timeout 120000');
      console.log('  4. Tente novamente: node start.js --force');
      console.log('');
      logToFile(`Erro: ${err.message}`);
      throw err;
    }
  } else {
    logger.success('Dependências já instaladas');
    logToFile('Dependências já instaladas');
  }
}

/**
 * Validar setup
 */
async function validateSetup() {
  separator('Validando Setup');

  const validations = [
    { name: 'Electron', path: 'node_modules/electron' },
    { name: 'Arquivo principal', path: 'src/electron/main.js' },
    { name: 'Diretório UI', path: 'ui' },
    { name: 'Diretório de scripts', path: 'scripts' },
  ];

  let validationFailed = false;

  for (const validation of validations) {
    const fullPath = path.join(config.projectRoot, validation.path);
    
    if (fs.existsSync(fullPath)) {
      logger.success(`${validation.name} encontrado`);
      logToFile(`${validation.name} encontrado`);
    } else {
      logger.error(`${validation.name} não encontrado: ${validation.path}`);
      logToFile(`${validation.name} não encontrado: ${validation.path}`);
      validationFailed = true;
    }
  }

  if (validationFailed) {
    throw new Error('Validação do setup falhou');
  }

  logger.success('Validação concluída com sucesso!');
  logToFile('Validação concluída com sucesso');
}

/**
 * Iniciar aplicação
 */
async function startApplication() {
  separator('Iniciando Pinokio');

  console.log('');
  logger.info('Pinokio está iniciando...');
  logger.info('Pressione Ctrl+C para parar a aplicação');
  logger.info(`Log de execução salvo em: setup.log`);
  console.log('');

  logToFile('Iniciando Pinokio');

  try {
    await runCommand('npm', ['start']);
    logger.success('Pinokio finalizou normalmente');
    logToFile('Pinokio finalizou normalmente');
    process.exit(0);
  } catch (err) {
    logger.error(`Falha ao iniciar Pinokio: ${err.message}`);
    logToFile(`Erro: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Processar argumentos
 */
function parseArguments() {
  const args = process.argv.slice(2);

  for (const arg of args) {
    switch (arg) {
      case '--force':
      case '-f':
        config.forceInstall = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.log(`Argumento desconhecido: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }
}

/**
 * Mostrar ajuda
 */
function showHelp() {
  console.log(`
Pinokio - Setup e Inicialização Inteligente

Uso: node start.js [OPÇÕES]

Opções:
  -f, --force     Força reinstalação de dependências
  -h, --help      Mostra esta ajuda

Exemplos:
  npm start               # Setup normal e inicia
  node start.js           # Alternativa com setup
  node start.js --force   # Força reinstalação
  
  `);
}

/**
 * Main
 */
async function main() {
  try {
    parseArguments();

    separator('Pinokio - Setup e Inicialização Inteligente');
    logger.info(`Data/Hora: ${new Date().toLocaleString()}`);
    logger.info(`Diretório: ${config.projectRoot}`);
    logToFile('======== Pinokio Setup e Inicialização ========');
    logToFile(`Data/Hora: ${new Date().toLocaleString()}`);
    logToFile(`Diretório: ${config.projectRoot}`);

    await checkPrerequisites();
    await setupEnvironment();
    await checkDependencies();
    await validateSetup();
    await startApplication();
  } catch (err) {
    console.log('');
    logger.error(err.message);
    logToFile(`FATAL ERROR: ${err.message}`);
    console.log('');
    console.log('Para mais detalhes, verifique: setup.log');
    console.log('');
    process.exit(1);
  }
}

// Executar
main();
