import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { put } from '@vercel/blob'
import { readJson, writeJson } from '../lib/json-store.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// File upload configuration - use memory storage for Vercel
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
  limits: {
    fileSize: 4.5 * 1024 * 1024 // 4.5MB limit for Vercel Blob
  }
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

// Upload endpoint - use Vercel Blob storage
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to Vercel Blob
    const filename = `${Date.now()}-${req.file.originalname}`
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype
    })

    res.json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default app