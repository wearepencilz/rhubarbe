import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const settingsFile = path.join(__dirname, '../public/data/settings.json')

console.log('🧹 Taxonomy Cleanup Helper\n')
console.log('This script helps identify tags that might need merging.\n')

// Read settings
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
const taxonomy = settings.taxonomy || []

// Find tags that contain commas (likely combined tags)
const combinedTags = taxonomy.filter(tag => tag.name.includes(','))

if (combinedTags.length === 0) {
  console.log('✅ No combined tags found. Your taxonomy looks clean!')
  process.exit(0)
}

console.log('📋 Found tags that might need splitting or merging:\n')

combinedTags.forEach(tag => {
  console.log(`   "${tag.name}" (used ${tag.usageCount}×)`)
  
  // Suggest individual tags
  const parts = tag.name.split(',').map(p => p.trim())
  console.log(`   → Could be split into: ${parts.map(p => `"${p}"`).join(', ')}`)
  
  // Check if individual tags already exist
  const existing = parts.filter(part => 
    taxonomy.some(t => t.name.toLowerCase() === part.toLowerCase() && t.id !== tag.id)
  )
  
  if (existing.length > 0) {
    console.log(`   ⚠️  These tags already exist: ${existing.map(e => `"${e}"`).join(', ')}`)
    console.log(`   💡 Consider merging in the CMS`)
  }
  
  console.log('')
})

console.log('💡 To merge tags:')
console.log('   1. Go to CMS → Tags & Taxonomy')
console.log('   2. Edit the combined tag name to match an existing tag')
console.log('   3. Remove the duplicate tag')
console.log('   4. Save changes')
console.log('')
