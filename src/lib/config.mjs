import fs from 'node:fs'
import path from 'node:path'

export const rootDir = process.cwd()
export const contentDir = path.join(rootDir, 'content')
export const publicDir = path.join(rootDir, 'public')
export const postsDir = path.join(publicDir, 'posts')
export const postsJsonPath = path.join(contentDir, 'posts.json')

export function ensureProjectDirs() {
  fs.mkdirSync(contentDir, { recursive: true })
  fs.mkdirSync(postsDir, { recursive: true })

  if (!fs.existsSync(postsJsonPath)) {
    fs.writeFileSync(postsJsonPath, '[]\n')
  }
}

export function readEnvFile(filePath = path.join(rootDir, '.env')) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const env = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const equalsIndex = trimmed.indexOf('=')

    if (equalsIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, equalsIndex).trim()
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }

  return env
}
