import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const skillDir = path.resolve(scriptDir, '..')
const envPath = path.join(skillDir, '.env')

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
        return [key, value]
      })
      .filter(([key]) => key)
  )
}

function parseArgs(argv) {
  const args = { htmlFile: '', category: '', dryRun: false }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]

    if (item === '--category' || item === '--c') {
      args.category = argv[index + 1] || ''
      index += 1
    } else if (item === '--dry-run') {
      args.dryRun = true
    } else if (!args.htmlFile) {
      args.htmlFile = item
    }
  }

  return args
}

function slugify(value) {
  return String(value || 'article')
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function getTitle(html, htmlFile) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  return decodeEntities(stripTags(title)) || path.basename(htmlFile, '.html')
}

function getSummary(html) {
  const metaDescription =
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)?.[1]
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
  const summary = decodeEntities(stripTags(metaDescription || paragraph))

  if (summary.length <= 160) {
    return summary
  }

  return `${summary.slice(0, 157).trim()}...`
}

function getDate(html) {
  const dateMatch = html.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  return dateMatch?.[1] || new Date().toISOString().slice(0, 10)
}

function requireConfig(env) {
  const missing = ['DOH_HOST', 'DOH_USER', 'DOH_PUBLIC_BASE_URL', 'DOH_BASE_PATH', 'DOH_REMOTE_DIR'].filter((key) => !env[key])

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')} in ${envPath}. Ask the user for host, user, password/key, public IP/base URL, base path, and remote directory.`)
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function rsyncWithPassword({ password, source, destination, flags }) {
  const expectScript = `
set timeout 300
spawn rsync ${flags.map((flag) => JSON.stringify(flag)).join(' ')} ${JSON.stringify(source)} ${JSON.stringify(destination)}
expect {
  "*assword:*" { send ${JSON.stringify(`${password}\r`)}; exp_continue }
  eof
}
`
  const tempFile = path.join(os.tmpdir(), `doh-publish-${Date.now()}.expect`)
  fs.writeFileSync(tempFile, expectScript)

  try {
    run('expect', [tempFile])
  } finally {
    fs.rmSync(tempFile, { force: true })
  }
}

function sshWithPassword({ password, user, host, command }) {
  const expectScript = `
set timeout 300
spawn ssh -o StrictHostKeyChecking=accept-new ${JSON.stringify(`${user}@${host}`)} ${JSON.stringify(command)}
expect {
  "*assword:*" { send ${JSON.stringify(`${password}\r`)}; exp_continue }
  eof
}
`
  const tempFile = path.join(os.tmpdir(), `doh-ssh-${Date.now()}.expect`)
  fs.writeFileSync(tempFile, expectScript)

  try {
    run('expect', [tempFile])
  } finally {
    fs.rmSync(tempFile, { force: true })
  }
}

const env = { ...readEnv(envPath), ...process.env }
const args = parseArgs(process.argv.slice(2))

if (!args.htmlFile) {
  throw new Error('Usage: node scripts/publish-html.mjs <html-file> --c <category>')
}

requireConfig(env)

const htmlFile = path.resolve(args.htmlFile)

if (!fs.existsSync(htmlFile)) {
  throw new Error(`HTML file not found: ${htmlFile}`)
}

const html = fs.readFileSync(htmlFile, 'utf8')
const title = getTitle(html, htmlFile)
const summary = getSummary(html) || title
const date = getDate(html)
const category = slugify(args.category || env.DOH_DEFAULT_CATEGORY || 'notes')
const remoteFileName = `${date}-${slugify(title)}.html`
const remoteDir = `${env.DOH_REMOTE_DIR.replace(/\/$/, '')}/${category}`
const remotePath = `${remoteDir}/${remoteFileName}`
const destination = `${env.DOH_USER}@${env.DOH_HOST}:${remotePath}`
const publicUrl = `${env.DOH_PUBLIC_BASE_URL.replace(/\/$/, '')}${env.DOH_BASE_PATH.replace(/\/$/, '')}/${category}/${encodeURIComponent(remoteFileName)}`
const flags = (env.DOH_RSYNC_FLAGS || '-az').split(/\s+/).filter(Boolean)
const mkdirCommand = `mkdir -p ${JSON.stringify(remoteDir)}`

if (args.dryRun) {
  console.log(`URL: ${publicUrl}`)
  console.log(`Summary: ${summary}`)
  process.exit(0)
}

if (env.DOH_PASSWORD) {
  sshWithPassword({ password: env.DOH_PASSWORD, user: env.DOH_USER, host: env.DOH_HOST, command: mkdirCommand })
  rsyncWithPassword({ password: env.DOH_PASSWORD, source: htmlFile, destination, flags })
} else {
  run('ssh', [`${env.DOH_USER}@${env.DOH_HOST}`, mkdirCommand])
  run('rsync', [...flags, htmlFile, destination])
}

console.log(`URL: ${publicUrl}`)
console.log(`Summary: ${summary}`)
