import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Setup test data directory
const testDataDir = path.join(__dirname, 'fixtures/data')
const sourceDataDir = path.join(__dirname, '../public/data')

// Ensure test data directory exists
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true })
}

// Copy production data to test fixtures before tests run
// This gives tests a clean starting point
const dataFiles = [
  'ingredients.json',
  'flavours.json',
  'formats.json',
  'modifiers.json',
  'products.json',
  'launches.json',
  'settings.json'
]

for (const file of dataFiles) {
  const sourcePath = path.join(sourceDataDir, file)
  const destPath = path.join(testDataDir, file)
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
  } else {
    // Create empty array if source doesn't exist
    fs.writeFileSync(destPath, JSON.stringify([], null, 2))
  }
}

console.log('✓ Test fixtures initialized from production data')
