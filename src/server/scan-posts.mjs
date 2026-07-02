import fs from 'node:fs'
import path from 'node:path'

function stripTags(value) {
  return String(value || '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function matchFirst(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return decodeHtmlEntities(stripTags(match[1]))
    }
  }

  return ''
}

function walkHtmlFiles(dir, rootDir = dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.name.startsWith('.') || entry.name === 'index.html') {
      return []
    }

    if (entry.isDirectory()) {
      return walkHtmlFiles(fullPath, rootDir)
    }

    if (!entry.isFile() || !entry.name.endsWith('.html')) {
      return []
    }

    return [path.relative(rootDir, fullPath)]
  })
}

function getDateFromPath(relativePath, stat) {
  const normalized = relativePath.split(path.sep).join('/')
  const dateMatch = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/)

  if (dateMatch) {
    return dateMatch[1]
  }

  return stat.mtime.toISOString().slice(0, 10)
}

function getCategory(relativePath) {
  const [category] = relativePath.split(path.sep)
  return category && category.endsWith('.html') ? 'notes' : category || 'notes'
}

function toUrl(basePath, relativePath) {
  const urlPath = relativePath.split(path.sep).map(encodeURIComponent).join('/')
  return `${basePath || ''}/${urlPath}`.replace(/\/{2,}/g, '/')
}

function extractPost(contentDir, relativePath, basePath) {
  const filePath = path.join(contentDir, relativePath)
  const html = fs.readFileSync(filePath, 'utf8')
  const stat = fs.statSync(filePath)
  const fileName = path.basename(relativePath, '.html')
  const title = matchFirst(html, [
    /<title[^>]*>([\s\S]*?)<\/title>/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
  ])
  const summary = matchFirst(html, [
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    /<p[^>]*>([\s\S]*?)<\/p>/i,
  ])

  return {
    category: getCategory(relativePath),
    date: getDateFromPath(relativePath, stat),
    fileName,
    path: relativePath.split(path.sep).join('/'),
    title: title || fileName,
    summary,
    url: toUrl(basePath, relativePath),
  }
}

export function scanPosts({ contentDir, basePath }) {
  return walkHtmlFiles(contentDir)
    .map((relativePath) => extractPost(contentDir, relativePath, basePath))
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return a.title.localeCompare(b.title)
    })
}

export function getCategories(posts) {
  return [...new Set(posts.map((post) => post.category))].sort()
}
