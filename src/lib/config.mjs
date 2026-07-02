import fs from 'node:fs'
import path from 'node:path'

export const rootDir = process.cwd()
export const publicDir = path.join(rootDir, 'public')
export const defaultBlogBasePath = '/blog'

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

export function normalizeBasePath(value = defaultBlogBasePath) {
  const raw = String(value || '').trim()

  if (!raw || raw === '/') {
    return ''
  }

  return `/${raw.replace(/^\/+|\/+$/g, '')}`
}

export function getBlogBasePath(env = { ...readEnvFile(), ...process.env }) {
  return normalizeBasePath(env.BLOG_BASE_PATH || defaultBlogBasePath)
}
