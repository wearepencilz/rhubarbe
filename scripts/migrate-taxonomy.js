import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectsFile = path.join(__dirname, '../public/data/projects.json')
const settingsFile = path.join(__dirname, '../public/data/settings.json')

console.log('🔄 Starting taxonomy migration...\n')

// Read existing data
const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'))
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))

// Extract all unique tags from projects
const allTags = new Set()

projects.forEach(project => {
  // Add category
  if (project.category) {
    allTags.add(project.category.trim())
  }
  
  // Add services
  if (Array.isArray(project.services)) {
    project.services.forEach(service => {
      if (service && typeof service === 'string') {
        allTags.add(service.trim())
      }
    })
  } else if (typeof project.services === 'string') {
    project.services.split(',').forEach(service => {
      const trimmed = service.trim()
      if (trimmed) allTags.add(trimmed)
    })
  }
})

console.log(`📊 Found ${allTags.size} unique tags from ${projects.length} projects:\n`)
Array.from(allTags).sort().forEach(tag => console.log(`   - ${tag}`))
console.log('')

// Create taxonomy entries
const taxonomy = Array.from(allTags).sort().map((name, index) => ({
  id: `tag-${Date.now()}-${index}`,
  name: name,
  link: '',
  type: 'general', // Can be used for filtering later
  usageCount: 0 // Will be calculated
}))

// Count usage
projects.forEach(project => {
  if (project.category) {
    const tag = taxonomy.find(t => t.name === project.category.trim())
    if (tag) tag.usageCount++
  }
  
  const services = Array.isArray(project.services) 
    ? project.services 
    : typeof project.services === 'string'
      ? project.services.split(',').map(s => s.trim())
      : []
  
  services.forEach(service => {
    const tag = taxonomy.find(t => t.name === service.trim())
    if (tag) tag.usageCount++
  })
})

// Update settings with unified taxonomy
settings.taxonomy = taxonomy

// Backup old taxonomy if it exists
if (settings.taxonomyServices || settings.taxonomyCategories) {
  settings.taxonomyBackup = {
    services: settings.taxonomyServices || [],
    categories: settings.taxonomyCategories || [],
    migratedAt: new Date().toISOString()
  }
  delete settings.taxonomyServices
  delete settings.taxonomyCategories
}

// Save updated settings
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2))

console.log('✅ Migration complete!\n')
console.log('📝 Summary:')
console.log(`   - Created ${taxonomy.length} taxonomy entries`)
console.log(`   - Saved to settings.json as "taxonomy"`)
console.log(`   - Old taxonomy backed up as "taxonomyBackup"`)
console.log('')
console.log('📋 Top 10 most used tags:')
taxonomy
  .sort((a, b) => b.usageCount - a.usageCount)
  .slice(0, 10)
  .forEach(tag => console.log(`   - ${tag.name} (used ${tag.usageCount} times)`))
console.log('')
console.log('💡 Next steps:')
console.log('   1. Review the taxonomy in CMS → Services & Categories')
console.log('   2. Merge similar tags if needed')
console.log('   3. Add links to tags for filtering pages')
console.log('')
