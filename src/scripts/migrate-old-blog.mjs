import fs from 'node:fs'
import path from 'node:path'
import { publicDir } from '../lib/config.mjs'

const oldBlogRoot = process.argv[2] || '/Users/bytedance/workspace/study/blog'
const sourceDir = path.join(oldBlogRoot, 'data/blog')
const oldPublicDir = path.join(oldBlogRoot, 'public')
const outputRoot = publicDir
const templatePath = path.join(process.cwd(), 'skills/article-to-html/references/template.html')

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('\n', ' ')
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) {
    return { data: {}, body: raw }
  }

  const end = raw.indexOf('\n---', 3)

  if (end === -1) {
    return { data: {}, body: raw }
  }

  const frontmatter = raw.slice(3, end).trim()
  const body = raw.slice(end + 4).trim()
  const data = {}

  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)

    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    const value = rawValue.trim()

    if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '')
    }
  }

  return { data, body }
}

function slugify(value) {
  return String(value || 'post')
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function readTemplateStyles() {
  const template = fs.readFileSync(templatePath, 'utf8')
  const match = template.match(/<style>([\s\S]*?)<\/style>/i)

  if (!match) {
    throw new Error(`Missing <style> block in ${templatePath}`)
  }

  return `${match[1]}

      .source-note {
        border-top: 1px solid var(--rule);
        color: var(--ink-faint);
        font-family:
          ui-monospace, Menlo,
          "PingFang SC", "Hiragino Sans GB", monospace;
        font-size: 11px;
        letter-spacing: 0.08em;
        margin-top: 56px;
        padding-top: 14px;
        text-transform: uppercase;
      }
`
}

function walkMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return walkMarkdownFiles(fullPath)
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      return [fullPath]
    }

    return []
  })
}

function inlineLocalImage(src, sourceFile) {
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) {
    return src
  }

  const resolvedPath = path.resolve(path.dirname(sourceFile), src)
  const fallbackPath = src.startsWith('/static/')
    ? path.join(oldPublicDir, src.replace(/^\/+/, ''))
    : resolvedPath
  const imagePath = fs.existsSync(resolvedPath) ? resolvedPath : fallbackPath

  if (!fs.existsSync(imagePath)) {
    return src
  }

  const ext = path.extname(imagePath).toLowerCase()
  const mime =
    ext === '.svg'
      ? 'image/svg+xml'
      : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/png'

  return `data:${mime};base64,${fs.readFileSync(imagePath).toString('base64')}`
}

function applyInlineMarkdown(text) {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => match)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return html
}

function parseTable(lines, startIndex) {
  const rows = []
  let index = startIndex

  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    rows.push(lines[index])
    index += 1
  }

  if (rows.length < 2 || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(rows[1])) {
    return null
  }

  const cells = (row) =>
    row
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => applyInlineMarkdown(cell.trim()))

  const header = cells(rows[0])
  const bodyRows = rows.slice(2).map(cells)
  const html = `<table>
  <thead><tr>${header.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead>
  <tbody>
    ${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('\n    ')}
  </tbody>
</table>`

  return { html, nextIndex: index }
}

function markdownToHtml(markdown, sourceFile) {
  const lines = normalizeImageLines(markdown).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = null
  let blockquote = []
  let h2Count = 0
  let figureCount = 0
  let index = 0
  let sectionOpen = false

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push(`<p>${applyInlineMarkdown(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }

  function flushList() {
    if (list) {
      blocks.push(`<${list.type}>\n${list.items.map((item) => `  <li>${applyInlineMarkdown(item)}</li>`).join('\n')}\n</${list.type}>`)
      list = null
    }
  }

  function flushBlockquote() {
    if (blockquote.length > 0) {
      blocks.push(`<blockquote>${applyInlineMarkdown(blockquote.join(' '))}</blockquote>`)
      blockquote = []
    }
  }

  function flushAll() {
    flushParagraph()
    flushList()
    flushBlockquote()
  }

  while (index < lines.length) {
    const line = lines[index]

    if (/^```/.test(line.trim())) {
      flushAll()
      const language = line.trim().slice(3).trim()
      const code = []
      index += 1

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        code.push(lines[index])
        index += 1
      }

      blocks.push(`<pre><code${language ? ` data-language="${escapeAttribute(language)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`)
      index += 1
      continue
    }

    const table = parseTable(lines, index)

    if (table) {
      flushAll()
      blocks.push(table.html)
      index = table.nextIndex
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)

    if (heading) {
      flushAll()
      const level = heading[1].length
      const text = applyInlineMarkdown(heading[2].trim())

      if (level === 2) {
        h2Count += 1
        if (sectionOpen) {
          blocks.push('</section>')
        }

        blocks.push(`<section>\n<h2><span class="num">${String(h2Count).padStart(2, '0')}</span>${text}</h2>`)
        sectionOpen = true
      } else {
        blocks.push(`<h${level}>${text}</h${level}>`)
      }

      index += 1
      continue
    }

    const image = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/)

    if (image) {
      flushAll()
      figureCount += 1
      const [, alt, src] = image
      const imageSrc = inlineLocalImage(src.trim(), sourceFile)
      const caption = alt || 'Image'
      blocks.push(`<figure>
  <img src="${escapeAttribute(imageSrc)}" alt="${escapeAttribute(caption)}">
  <figcaption><span class="fig-num">FIG ${figureCount}</span>${escapeHtml(caption)}</figcaption>
</figure>`)
      index += 1
      continue
    }

    const quote = line.match(/^\s*>\s?(.*)$/)

    if (quote) {
      flushParagraph()
      flushList()
      blockquote.push(quote[1])
      index += 1
      continue
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/)

    if (unordered || ordered) {
      flushParagraph()
      flushBlockquote()
      const type = ordered ? 'ol' : 'ul'
      const item = (ordered || unordered)[1]

      if (!list || list.type !== type) {
        flushList()
        list = { type, items: [] }
      }

      list.items.push(item)
      index += 1
      continue
    }

    if (!line.trim()) {
      flushAll()
      index += 1
      continue
    }

    paragraph.push(line.trim())
    index += 1
  }

  flushAll()

  if (sectionOpen) {
    blocks.push('</section>')
  }

  return blocks.join('\n')
}

function normalizeImageLines(markdown) {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((line) => {
      const images = [...line.matchAll(/!\[[^\]]*]\([^)]+\)/g)].map((match) => match[0])

      if (images.length === 0 || /^\s*!\[[^\]]*]\([^)]+\)\s*$/.test(line)) {
        return [line]
      }

      const text = line.replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
      return [text, ...images].filter(Boolean)
    })
    .join('\n')
}

function firstParagraph(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^#+\s+.*$/gm, '').trim())
    .find(Boolean)
}

function renderPage({ metadata, contentHtml, sourceRelativePath, styles }) {
  const title = metadata.title || 'Untitled'
  const summary = metadata.summary || firstParagraph(metadata.body) || ''
  const tags = Array.isArray(metadata.tags) ? metadata.tags : []

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(summary)}" />
    <style>${styles}</style>
  </head>
  <body>
    <article class="doc">
      <header class="doc-header">
        <div class="doc-eyebrow"><span class="mascot"></span>${escapeHtml(tags[0] || 'Blog')} · Migrated Article</div>
        <h1 class="doc-title">${escapeHtml(title)}</h1>
        <p class="doc-subtitle">${escapeHtml(summary)}</p>
        <div class="doc-meta">
          <span>DATE · ${escapeHtml(metadata.date || '')}</span>
          <span>TAGS · ${escapeHtml(tags.join(', ') || 'none')}</span>
          <span>SOURCE · old blog</span>
        </div>
      </header>

      <div class="tldr">
        <div class="tldr-label">TL;DR</div>
        ${escapeHtml(summary || '迁移自旧博客。')}
      </div>

      ${contentHtml}

      <div class="source-note">Migrated from ${escapeHtml(sourceRelativePath)}</div>
    </article>
  </body>
</html>
`
}

function migratePost(filePath, styles) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, body } = parseFrontmatter(raw)

  if (data.draft === true) {
    return { skipped: true, filePath, reason: 'draft' }
  }

  const sourceRelativePath = path.relative(oldBlogRoot, filePath)
  const tags = Array.isArray(data.tags) ? data.tags : []
  const category = slugify(tags[0] || path.basename(path.dirname(filePath)))
  const date = data.date || path.basename(path.dirname(filePath)).replace(/^(\d{4})(\d{2})$/, '$1-$2-01')
  const slug = slugify(path.basename(filePath, '.md'))
  const outputDir = path.join(outputRoot, category)
  const outputPath = path.join(outputDir, `${date}-${slug}.html`)
  const contentHtml = markdownToHtml(body, filePath)
  const html = renderPage({
    metadata: { ...data, body },
    contentHtml,
    sourceRelativePath,
    styles,
  })

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputPath, html)

  return { skipped: false, filePath, outputPath }
}

const styles = readTemplateStyles()
const files = walkMarkdownFiles(sourceDir)
const results = files.map((filePath) => migratePost(filePath, styles))
const migrated = results.filter((result) => !result.skipped)
const skipped = results.filter((result) => result.skipped)

for (const result of migrated) {
  console.log(`migrated ${path.relative(oldBlogRoot, result.filePath)} -> ${path.relative(process.cwd(), result.outputPath)}`)
}

for (const result of skipped) {
  console.log(`skipped ${path.relative(oldBlogRoot, result.filePath)} (${result.reason})`)
}

console.log(`Migrated ${migrated.length} posts, skipped ${skipped.length}.`)
