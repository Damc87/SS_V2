const { spawn } = require('child_process');
const path = require('path');
const waitOn = require('wait-on');

const electronBinary = require('electron');

const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const mainEntry = path.resolve(__dirname, '..', 'dist-electron', 'main.js');

const waitTargets = [devServerUrl, mainEntry];

let electronProcess;

function log(message) {
  console.log(`[dev:electron] ${message}`);
}

function launchElectron() {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill();
  }

  log('Starting Electron...');
  electronProcess = spawn(electronBinary, [mainEntry], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: devServerUrl,
    },
  });

  electronProcess.on('exit', (code, signal) => {
    const reason = signal || code || 0;
    log(`Electron closed (${reason}). Type "rs" + Enter to restart, or Ctrl+C to stop the dev server.`);
  });
}

function setupKeyboardRestart() {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (data) => {
    const trimmed = data.trim().toLowerCase();
    if (trimmed === 'rs') {
      launchElectron();
    }
  });
  process.stdin.resume();
}

function cleanupAndExit() {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill();
  }
  process.exit();
}

async function main() {
  setupKeyboardRestart();
  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);

  log(`Waiting for dev server (${devServerUrl}) and compiled main process...`);
  try {
    await waitOn({
      resources: waitTargets,
      interval: 250,
      timeout: 60000,
      window: 1000,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  launchElectron();
}

main();
