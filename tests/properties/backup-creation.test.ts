/**
 * Property Test: Migration Backup Creation
 * 
 * Property 2: Migration Backup Creation
 * Validates: Requirements 0.7
 * 
 * Feature: launch-first-cms-model, Property 2: For any migration execution,
 * the system should create timestamped backup files for all affected tables
 * before making any changes.
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createBackup, createBackups } from '@/lib/migration/backup'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Property 2: Migration Backup Creation', () => {
  const testDataDir = path.join(__dirname, '../../public/data')
  const testBackupDir = path.join(testDataDir, 'backups')
  
  // Clean up test backups after each test
  afterEach(() => {
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true })
    }
  })

  // Generator for valid ISO 8601 timestamps
  const timestampArb = fc.integer({ min: 1577836800000, max: 1767225600000 })
    .map(timestamp => new Date(timestamp).toISOString())

  // Generator for valid filenames
  const filenameArb = fc.constantFrom(
    'ingredients.json',
    'flavours.json',
    'formats.json',
    'modifiers.json',
    'sellables.json',
    'launches.json',
    'batches.json',
    'offerings.json'
  )

  // Generator for JSON data content
  const jsonDataArb = fc.array(
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      createdAt: timestampArb,
      updatedAt: timestampArb
    }),
    { minLength: 1, maxLength: 10 }
  )

  // Helper to create a test data file
  const createTestDataFile = (filename: string, data: any): void => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
    const filePath = path.join(testDataDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  }

  // Helper to clean up test data file
  const cleanupTestDataFile = (filename: string): void => {
    const filePath = path.join(testDataDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  it('**Validates: Requirements 0.7** - should create timestamped backups before migration', async () => {
    // Property: For any migration execution with a timestamp, backups should be created
    // with that timestamp in the directory name
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        jsonDataArb,
        timestampArb,
        async (filename, data, timestamp) => {
          // Setup: Create test data file
          createTestDataFile(filename, data)

          try {
            // Execute: Create backup
            const manifest = await createBackup(filename, timestamp)

            // Verify: Backup was successful
            expect(manifest.success).toBe(true)
            expect(manifest.errors).toHaveLength(0)

            // Verify: Timestamp is preserved in manifest
            expect(manifest.timestamp).toBe(timestamp)

            // Verify: Backup directory contains sanitized timestamp
            const sanitizedTimestamp = timestamp.replace(/[:.]/g, '-')
            expect(manifest.backupDir).toContain(sanitizedTimestamp)

            // Verify: Backup directory exists
            expect(fs.existsSync(manifest.backupDir)).toBe(true)

            // Verify: Backup file was created
            expect(manifest.files).toHaveLength(1)
            const fileInfo = manifest.files[0]
            expect(fileInfo.backedUp).toBe(true)
            expect(fileInfo.filename).toBe(filename)
            expect(fs.existsSync(fileInfo.backupPath)).toBe(true)

            // Verify: Backup file content matches original
            const originalContent = fs.readFileSync(fileInfo.originalPath, 'utf-8')
            const backupContent = fs.readFileSync(fileInfo.backupPath, 'utf-8')
            expect(backupContent).toBe(originalContent)

            // Verify: File size is recorded correctly
            const stats = fs.statSync(fileInfo.backupPath)
            expect(fileInfo.size).toBe(stats.size)
          } finally {
            // Cleanup
            cleanupTestDataFile(filename)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should create backup manifest with all necessary information', async () => {
    // Property: Every backup manifest should contain timestamp, backupDir, files array,
    // success status, and errors array
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        jsonDataArb,
        timestampArb,
        async (filename, data, timestamp) => {
          // Setup
          createTestDataFile(filename, data)

          try {
            // Execute
            const manifest = await createBackup(filename, timestamp)

            // Verify: Manifest has all required fields
            expect(manifest).toHaveProperty('timestamp')
            expect(manifest).toHaveProperty('backupDir')
            expect(manifest).toHaveProperty('files')
            expect(manifest).toHaveProperty('success')
            expect(manifest).toHaveProperty('errors')

            // Verify: Fields have correct types
            expect(typeof manifest.timestamp).toBe('string')
            expect(typeof manifest.backupDir).toBe('string')
            expect(Array.isArray(manifest.files)).toBe(true)
            expect(typeof manifest.success).toBe('boolean')
            expect(Array.isArray(manifest.errors)).toBe(true)

            // Verify: File info has all required fields
            if (manifest.files.length > 0) {
              const fileInfo = manifest.files[0]
              expect(fileInfo).toHaveProperty('filename')
              expect(fileInfo).toHaveProperty('originalPath')
              expect(fileInfo).toHaveProperty('backupPath')
              expect(fileInfo).toHaveProperty('size')
              expect(fileInfo).toHaveProperty('backedUp')
            }
          } finally {
            cleanupTestDataFile(filename)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should create backups before any data changes occur', async () => {
    // Property: Backup files should exist and contain original data before any
    // migration operations modify the source files
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        jsonDataArb,
        timestampArb,
        async (filename, data, timestamp) => {
          // Setup
          createTestDataFile(filename, data)
          const originalPath = path.join(testDataDir, filename)
          const originalContent = fs.readFileSync(originalPath, 'utf-8')
          const originalStats = fs.statSync(originalPath)

          try {
            // Execute: Create backup
            const manifest = await createBackup(filename, timestamp)

            // Verify: Backup was created successfully
            expect(manifest.success).toBe(true)

            // Verify: Original file still exists and is unchanged
            expect(fs.existsSync(originalPath)).toBe(true)
            const currentContent = fs.readFileSync(originalPath, 'utf-8')
            expect(currentContent).toBe(originalContent)

            // Verify: Backup file exists and matches original
            const fileInfo = manifest.files[0]
            expect(fs.existsSync(fileInfo.backupPath)).toBe(true)
            const backupContent = fs.readFileSync(fileInfo.backupPath, 'utf-8')
            expect(backupContent).toBe(originalContent)

            // Verify: File sizes match
            expect(fileInfo.size).toBe(originalStats.size)

            // Simulate a migration change to the original file
            const modifiedData = [...data, { id: 'new-id', name: 'Modified', createdAt: timestamp, updatedAt: timestamp }]
            fs.writeFileSync(originalPath, JSON.stringify(modifiedData, null, 2))

            // Verify: Backup still contains original data (unchanged by migration)
            const backupContentAfterChange = fs.readFileSync(fileInfo.backupPath, 'utf-8')
            expect(backupContentAfterChange).toBe(originalContent)
            expect(backupContentAfterChange).not.toBe(fs.readFileSync(originalPath, 'utf-8'))
          } finally {
            cleanupTestDataFile(filename)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should create multiple backups with the same timestamp', async () => {
    // Property: When backing up multiple files, all should use the same timestamp
    // and be grouped in the same backup directory
    await fc.assert(
      fc.asyncProperty(
        fc.array(filenameArb, { minLength: 2, maxLength: 5 }).map(arr => [...new Set(arr)]),
        jsonDataArb,
        timestampArb,
        async (filenames, data, timestamp) => {
          // Setup: Create multiple test data files
          filenames.forEach(filename => createTestDataFile(filename, data))

          try {
            // Execute: Create backups for all files
            const manifest = await createBackups(filenames, timestamp)

            // Verify: All backups succeeded
            expect(manifest.success).toBe(true)
            expect(manifest.errors).toHaveLength(0)

            // Verify: All files were backed up
            expect(manifest.files).toHaveLength(filenames.length)
            expect(manifest.files.every(f => f.backedUp)).toBe(true)

            // Verify: All backups share the same timestamp
            expect(manifest.timestamp).toBe(timestamp)

            // Verify: All backups are in the same directory
            const backupDirs = new Set(manifest.files.map(f => path.dirname(f.backupPath)))
            expect(backupDirs.size).toBe(1)
            expect(manifest.backupDir).toBe([...backupDirs][0])

            // Verify: Each backup file exists and matches original
            manifest.files.forEach(fileInfo => {
              expect(fs.existsSync(fileInfo.backupPath)).toBe(true)
              const originalContent = fs.readFileSync(fileInfo.originalPath, 'utf-8')
              const backupContent = fs.readFileSync(fileInfo.backupPath, 'utf-8')
              expect(backupContent).toBe(originalContent)
            })
          } finally {
            // Cleanup
            filenames.forEach(filename => cleanupTestDataFile(filename))
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle non-existent files gracefully', async () => {
    // Property: When attempting to backup a non-existent file, the manifest should
    // indicate failure with appropriate error information
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }).map(s => `${s}.json`),
        timestampArb,
        async (filename, timestamp) => {
          // Ensure file doesn't exist
          const filePath = path.join(testDataDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }

          // Execute: Attempt to create backup
          const manifest = await createBackup(filename, timestamp)

          // Verify: Backup failed
          expect(manifest.success).toBe(false)
          expect(manifest.errors.length).toBeGreaterThan(0)

          // Verify: File info indicates failure
          expect(manifest.files).toHaveLength(1)
          const fileInfo = manifest.files[0]
          expect(fileInfo.backedUp).toBe(false)
          expect(fileInfo.error).toBeDefined()
          expect(fileInfo.error).toContain('does not exist')
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should sanitize timestamps for directory names', async () => {
    // Property: Timestamps with special characters should be sanitized for use in
    // directory names (colons and periods replaced with hyphens)
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        jsonDataArb,
        timestampArb,
        async (filename, data, timestamp) => {
          // Setup
          createTestDataFile(filename, data)

          try {
            // Execute
            const manifest = await createBackup(filename, timestamp)

            // Verify: Backup directory name doesn't contain invalid characters
            const dirName = path.basename(manifest.backupDir)
            expect(dirName).not.toContain(':')
            expect(dirName).not.toContain('.')

            // Verify: Sanitized timestamp is used in path
            const sanitizedTimestamp = timestamp.replace(/[:.]/g, '-')
            expect(manifest.backupDir).toContain(sanitizedTimestamp)
          } finally {
            cleanupTestDataFile(filename)
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should validate input parameters', async () => {
    // Property: Invalid inputs (empty strings, null, undefined) should result in
    // failed backups with appropriate error messages
    
    // Test invalid filenames
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('', '   '),
        timestampArb,
        async (invalidFilename, timestamp) => {
          // Execute: Attempt backup with invalid filename
          const manifest = await createBackup(invalidFilename, timestamp)

          // Verify: Backup failed
          expect(manifest.success).toBe(false)
          expect(manifest.errors.length).toBeGreaterThan(0)
          expect(manifest.errors[0]).toContain('Invalid filename')
        }
      ),
      { numRuns: 10 }
    )

    // Test invalid timestamps
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        fc.constantFrom('', '   '),
        async (filename, invalidTimestamp) => {
          // Execute: Attempt backup with invalid timestamp
          const manifest = await createBackup(filename, invalidTimestamp)

          // Verify: Backup failed
          expect(manifest.success).toBe(false)
          expect(manifest.errors.length).toBeGreaterThan(0)
          expect(manifest.errors[0]).toContain('Invalid timestamp')
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve backup integrity across multiple operations', async () => {
    // Property: Creating multiple backups with different timestamps should not
    // interfere with each other
    await fc.assert(
      fc.asyncProperty(
        filenameArb,
        jsonDataArb,
        fc.array(timestampArb, { minLength: 2, maxLength: 4 }).map(arr => [...new Set(arr)]),
        async (filename, data, timestamps) => {
          // Setup
          createTestDataFile(filename, data)

          try {
            // Execute: Create multiple backups with different timestamps
            const manifests = await Promise.all(
              timestamps.map(ts => createBackup(filename, ts))
            )

            // Verify: All backups succeeded
            expect(manifests.every(m => m.success)).toBe(true)

            // Verify: Each backup is in a separate directory
            const backupDirs = manifests.map(m => m.backupDir)
            const uniqueDirs = new Set(backupDirs)
            expect(uniqueDirs.size).toBe(timestamps.length)

            // Verify: All backup files exist and contain correct data
            manifests.forEach(manifest => {
              const fileInfo = manifest.files[0]
              expect(fs.existsSync(fileInfo.backupPath)).toBe(true)
              const backupContent = fs.readFileSync(fileInfo.backupPath, 'utf-8')
              const originalContent = fs.readFileSync(fileInfo.originalPath, 'utf-8')
              expect(backupContent).toBe(originalContent)
            })
          } finally {
            cleanupTestDataFile(filename)
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})
