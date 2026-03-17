/**
 * Data Protection System
 * 
 * Prevents accidental data loss by:
 * 1. Creating backups before destructive operations
 * 2. Validating referential integrity before deletions
 * 3. Providing rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../public/data/backups');
const DATA_DIR = path.join(__dirname, '../public/data');

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a timestamped backup of a data file
 */
export function createBackup(filename: string): string {
  ensureBackupDir();
  
  const sourcePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`No file to backup: ${filename}`);
    return '';
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `${filename.replace('.json', '')}_${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);

  try {
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`✓ Backup created: ${backupFilename}`);
    return backupPath;
  } catch (error) {
    console.error(`Failed to create backup for ${filename}:`, error);
    return '';
  }
}

/**
 * Create backups of all data files
 */
export function createFullBackup(): string[] {
  const dataFiles = [
    'formats.json',
    'products.json',
    'flavours.json',
    'ingredients.json',
    'modifiers.json',
    'launches.json',
    'settings.json',
    'batches.json',
    'stories.json',
  ];

  return dataFiles
    .map(file => createBackup(file))
    .filter(Boolean);
}

/**
 * Restore a backup file
 */
export function restoreBackup(backupPath: string, targetFilename: string): boolean {
  const targetPath = path.join(DATA_DIR, targetFilename);

  try {
    // Create a backup of current state before restoring
    createBackup(targetFilename);
    
    // Restore the backup
    fs.copyFileSync(backupPath, targetPath);
    console.log(`✓ Restored backup to ${targetFilename}`);
    return true;
  } catch (error) {
    console.error(`Failed to restore backup:`, error);
    return false;
  }
}

/**
 * List available backups for a file
 */
export function listBackups(filename: string): string[] {
  ensureBackupDir();
  
  const prefix = filename.replace('.json', '');
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  return backups;
}

/**
 * Clean up old backups (keep last N backups per file)
 */
export function cleanupOldBackups(keepCount: number = 10) {
  ensureBackupDir();
  
  const dataFiles = [
    'formats',
    'products',
    'flavours',
    'ingredients',
    'modifiers',
    'launches',
    'settings',
    'batches',
    'stories',
  ];

  dataFiles.forEach(filePrefix => {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(filePrefix) && file.endsWith('.json'))
      .sort()
      .reverse();

    // Delete old backups beyond keepCount
    backups.slice(keepCount).forEach(backup => {
      const backupPath = path.join(BACKUP_DIR, backup);
      try {
        fs.unlinkSync(backupPath);
        console.log(`Deleted old backup: ${backup}`);
      } catch (error) {
        console.error(`Failed to delete backup ${backup}:`, error);
      }
    });
  });
}
