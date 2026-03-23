import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { readJson, writeJson } from './lib/json-store.js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || true
    : 'http://localhost:5173',
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed. Received: ${file.mimetype} (${ext})`))
  }
}

const upload = multer({ storage, fileFilter })

const newsFile = path.join(__dirname, 'public/data/news.json')
const settingsFile = path.join(__dirname, 'public/data/settings.json')
const pagesFile = path.join(__dirname, 'public/data/pages.json')

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    console.log('✅ File uploaded:', req.file.filename, 'Type:', req.file.mimetype)
    // Return relative URL so it works in both dev and production
    res.json({ url: `/uploads/${req.file.filename}` })
  } else {
    console.error('❌ No file uploaded')
    res.status(400).json({ error: 'No file uploaded' })
  }
})

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error.message)
    return res.status(400).json({ error: `Upload error: ${error.message}` })
  } else if (error) {
    console.error('❌ Upload error:', error.message)
    return res.status(400).json({ error: error.message })
  }
  next()
})

// News endpoints
app.get('/api/news', async (req, res) => {
  try {
    const data = readJson('news.json')
    res.json(data || [])
  } catch (error) {
    res.json([])
  }
})

app.post('/api/news', async (req, res) => {
  try {
    const news = readJson('news.json') || []
    const newItem = { ...req.body, id: Date.now() }
    news.push(newItem)
    writeJson('news.json', news)
    res.json(newItem)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/news/:id', async (req, res) => {
  try {
    const news = readJson('news.json') || []
    const index = news.findIndex(n => n.id === parseInt(req.params.id))
    if (index !== -1) {
      news[index] = { ...req.body, id: parseInt(req.params.id) }
      writeJson('news.json', news)
      res.json(news[index])
    } else {
      res.status(404).json({ error: 'News not found' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/news/:id', async (req, res) => {
  try {
    const news = readJson('news.json') || []
    const filtered = news.filter(n => n.id !== parseInt(req.params.id))
    writeJson('news.json', filtered)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const data = readJson('settings.json')
    res.json(data || { logo: '', email: '', companyName: '' })
  } catch (error) {
    res.json({ logo: '', email: '', companyName: '' })
  }
})

app.put('/api/settings', async (req, res) => {
  try {
    writeJson('settings.json', req.body)
    res.json(req.body)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Pages endpoints
app.get('/api/pages', async (req, res) => {
  try {
    const data = readJson('pages.json')
    res.json(data || {})
  } catch (error) {
    res.json({})
  }
})

app.get('/api/pages/:pageName', async (req, res) => {
  try {
    const pages = readJson('pages.json') || {}
    res.json(pages[req.params.pageName] || {})
  } catch (error) {
    res.json({})
  }
})

app.put('/api/pages/:pageName', async (req, res) => {
  try {
    const pages = readJson('pages.json') || {}
    pages[req.params.pageName] = req.body
    writeJson('pages.json', pages)
    res.json(pages[req.params.pageName])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}
