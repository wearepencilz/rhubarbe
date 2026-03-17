import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from 'redis'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

const dataDir = path.join(__dirname, '../public/data')

async function migrateToRedis() {
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL not found in .env.local')
    console.error('Run: vercel env pull .env.local')
    process.exit(1)
  }

  console.log('🔄 Connecting to Redis...')
  const redis = await createClient({
    url: process.env.REDIS_URL
  }).connect()

  console.log('✅ Connected to Redis\n')

  const files = [
    'projects.json',
    'news.json',
    'settings.json',
    'pages.json',
    'flavours.json',
    'ingredients.json',
    'formats.json',
    'modifiers.json',
    'launches.json',
    'products.json',
    'taxonomies.json',
    'stories.json',
    'users.json',
    'bundles.json',
  ]

  for (const filename of files) {
    const filePath = path.join(dataDir, filename)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} (file not found)`)
      continue
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const key = filename.replace('.json', '')
    
    await redis.set(key, JSON.stringify(data))
    console.log(`✅ Migrated ${filename} to Redis (key: ${key})`)
    
    // Show preview of data
    if (Array.isArray(data)) {
      console.log(`   → ${data.length} items`)
    } else if (typeof data === 'object') {
      console.log(`   → ${Object.keys(data).length} keys`)
    }
  }

  console.log('\n🎉 Migration complete!')
  console.log('Your local data is now in production Redis.')
  
  await redis.quit()
}

migrateToRedis().catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
