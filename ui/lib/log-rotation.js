// backend/lib/log-rotation.js
// Log rotation utility for Pinokio
// Prevents disk full by rotating logs when they exceed max size

const fs = require('fs');
const path = require('path');

// Configuration
const LOG_DIR = path.join(__dirname, '../logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5; // Keep last 5 rotated files

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Get log file size in bytes
 * @param {string} logPath - Full path to log file
 * @returns {number} Size in bytes, or 0 if file doesn't exist
 */
function getLogSize(logPath) {
  try {
    if (!fs.existsSync(logPath)) return 0;
    const stats = fs.statSync(logPath);
    return stats.size;
  } catch (err) {
    console.error(`[LogRotation] Error getting log size: ${err.message}`);
    return 0;
  }
}

/**
 * Rotate log file: app.log → app.log.1 → app.log.2 → ... → app.log.N
 * @param {string} logPath - Full path to log file to rotate
 * @returns {boolean} True if rotation succeeded
 */
function rotateLog(logPath) {
  try {
    const size = getLogSize(logPath);
    
    // Check if rotation is needed
    if (size < MAX_LOG_SIZE) {
      return false;
    }
    
    const baseName = path.basename(logPath);
    const dirName = path.dirname(logPath);
    
    // Rotate existing backup files (5 → 6, 4 → 5, ..., 1 → 2)
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldFile = path.join(dirName, `${baseName}.${i}`);
      const newFile = path.join(dirName, `${baseName}.${i + 1}`);
      
      if (fs.existsSync(oldFile)) {
        // Delete oldest if we're at the limit
        if (i === MAX_LOG_FILES - 1) {
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }
    
    // Rotate current log to .1
    const backupFile = `${logPath}.1`;
    fs.renameSync(logPath, backupFile);
    
    console.log(`[LogRotation] ✅ Rotated log: ${baseName} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    
    return true;
  } catch (err) {
    console.error(`[LogRotation] ❌ Error rotating log: ${err.message}`);
    return false;
  }
}

/**
 * Check and rotate all logs in directory
 * @param {string} directory - Directory to scan for logs
 * @returns {number} Number of logs rotated
 */
function rotateLogsInDirectory(directory = LOG_DIR) {
  try {
    ensureLogDir();
    
    if (!fs.existsSync(directory)) {
      return 0;
    }
    
    const files = fs.readdirSync(directory);
    let rotated = 0;
    
    for (const file of files) {
      // Only rotate .log files (not .log.1, .log.2, etc.)
      if (file.endsWith('.log') && !file.includes('.log.')) {
        const logPath = path.join(directory, file);
        if (rotateLog(logPath)) {
          rotated++;
        }
      }
    }
    
    return rotated;
  } catch (err) {
    console.error(`[LogRotation] Error rotating logs in directory: ${err.message}`);
    return 0;
  }
}

/**
 * Clean old rotated logs (older than retention days)
 * @param {string} directory - Directory to clean
 * @param {number} retentionDays - Keep logs newer than this many days
 * @returns {number} Number of logs deleted
 */
function cleanOldLogs(directory = LOG_DIR, retentionDays = 30) {
  try {
    if (!fs.existsSync(directory)) {
      return 0;
    }
    
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(directory);
    let deleted = 0;
    
    for (const file of files) {
      // Only clean rotated logs (.log.1, .log.2, etc.)
      if (file.match(/\.log\.\d+$/)) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }
    }
    
    if (deleted > 0) {
      console.log(`[LogRotation] 🗑️  Cleaned ${deleted} old log files (>${retentionDays} days)`);
    }
    
    return deleted;
  } catch (err) {
    console.error(`[LogRotation] Error cleaning old logs: ${err.message}`);
    return 0;
  }
}

/**
 * Get logger instance with automatic rotation
 * @param {string} logName - Name of the log file (without .log extension)
 * @returns {object} Logger object with info, warn, error methods
 */
function getLogger(logName = 'app') {
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${logName}.log`);
  
  // Check rotation before each write
  const checkRotation = () => {
    rotateLog(logPath);
  };
  
  const write = (level, message) => {
    checkRotation();
    
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
      fs.appendFileSync(logPath, logLine, 'utf8');
    } catch (err) {
      console.error(`[LogRotation] Error writing to log: ${err.message}`);
    }
  };
  
  return {
    info: (msg) => write('INFO', msg),
    warn: (msg) => write('WARN', msg),
    error: (msg) => write('ERROR', msg),
    debug: (msg) => write('DEBUG', msg),
  };
}

module.exports = {
  rotateLog,
  rotateLogsInDirectory,
  cleanOldLogs,
  getLogger,
  LOG_DIR,
  MAX_LOG_SIZE,
  MAX_LOG_FILES,
};
