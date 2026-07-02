import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { getBlogBasePath, publicDir, readEnvFile } from '../lib/config.mjs'

const env = { ...readEnvFile(), ...process.env }
const requiredKeys = ['BLOG_HOST', 'BLOG_USER', 'BLOG_REMOTE_DIR']
const missing = requiredKeys.filter((key) => !env[key])

if (missing.length > 0) {
  throw new Error(`Missing publish config in .env: ${missing.join(', ')}`)
}

if (!fs.existsSync(publicDir)) {
  throw new Error('Missing public/ directory. Run npm run build first.')
}

const flags = env.BLOG_RSYNC_FLAGS || '-az --delete'
const destination = `${env.BLOG_USER}@${env.BLOG_HOST}:${env.BLOG_REMOTE_DIR.replace(/\/$/, '')}/`
const args = [...flags.split(/\s+/).filter(Boolean), `${publicDir.replace(/\/$/, '')}/`, destination]
const result = spawnSync('rsync', args, { stdio: 'inherit' })

if (result.error) {
  throw result.error
}

if (result.status !== 0) {
  process.exit(result.status || 1)
}

console.log(`Published to ${destination}`)

if (env.BLOG_BASE_URL) {
  const baseUrl = env.BLOG_BASE_URL.replace(/\/$/, '')
  const basePath = getBlogBasePath(env)
  console.log(`Site: ${baseUrl}${basePath || '/'}`)
}
