import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  const gitHash = execSync('git rev-parse --short HEAD').toString().trim()
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  const buildTime = new Date().toISOString()
  
  // Use Vercel environment variables if available
  const vercelGitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA
  const vercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF
  
  const buildInfo = {
    hash: vercelGitCommitSha ? vercelGitCommitSha.substring(0, 7) : gitHash,
    branch: vercelGitCommitRef || gitBranch,
    timestamp: buildTime,
    version: vercelGitCommitSha 
      ? `${vercelGitCommitRef || 'main'}-${vercelGitCommitSha.substring(0, 7)}`
      : `${gitBranch}-${gitHash}`
  }

  const outputPath = path.join(__dirname, '../src/buildInfo.json')
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2))
  
  console.log('✅ Build info generated:', buildInfo.version)
} catch (error) {
  console.warn('⚠️  Could not generate build info:', error.message)
  // Create a fallback build info
  const buildInfo = {
    hash: 'unknown',
    branch: 'unknown',
    timestamp: new Date().toISOString(),
    version: 'dev'
  }
  const outputPath = path.join(__dirname, '../src/buildInfo.json')
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2))
}
