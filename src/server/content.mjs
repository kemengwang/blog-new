import path from 'node:path'
import { getBlogBasePath, publicDir, readEnvFile } from '../lib/config.mjs'

export function getRuntimeConfig() {
  const env = { ...readEnvFile(), ...process.env }

  return {
    basePath: getBlogBasePath(env),
    contentDir: path.resolve(env.BLOG_CONTENT_DIR || publicDir),
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT || 3436),
  }
}
