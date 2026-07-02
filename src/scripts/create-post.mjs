import fs from 'node:fs'
import path from 'node:path'
import { parseArgs, required } from '../lib/args.mjs'
import { ensureProjectDirs, postsDir } from '../lib/config.mjs'
import { renderPostPage } from '../lib/html.mjs'
import { upsertPost } from '../lib/posts.mjs'
import { slugify, splitTags, today } from '../lib/slug.mjs'

function readStdin() {
  return fs.readFileSync(0, 'utf8')
}

function readContent(args) {
  if (args.stdin) {
    return readStdin()
  }

  if (args['content-file']) {
    return fs.readFileSync(path.resolve(String(args['content-file'])), 'utf8')
  }

  if (args.content) {
    return String(args.content)
  }

  throw new Error('Provide --stdin, --content-file, or --content')
}

ensureProjectDirs()

const args = parseArgs(process.argv.slice(2))
const title = required(args, 'title')
const date = typeof args.date === 'string' ? args.date : today()
const slug = typeof args.slug === 'string' ? slugify(args.slug) : slugify(title)
const summary = typeof args.summary === 'string' ? args.summary.trim() : ''
const tags = splitTags(args.tags)
const contentHtml = readContent(args)
const year = date.slice(0, 4)
const fileName = `${slug}.html`
const relativeUrl = `/posts/${year}/${fileName}`
const outputDir = path.join(postsDir, year)
const outputPath = path.join(outputDir, fileName)
const post = {
  title,
  slug,
  summary,
  date,
  tags,
  url: relativeUrl,
  createdAt: new Date().toISOString(),
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputPath, renderPostPage(post, contentHtml))
upsertPost(post)

const { renderIndexPage } = await import('../lib/html.mjs')
const { readPosts } = await import('../lib/posts.mjs')
const { publicDir } = await import('../lib/config.mjs')
fs.writeFileSync(path.join(publicDir, 'index.html'), renderIndexPage(readPosts()))

console.log(`Created ${outputPath}`)
console.log(`URL path: ${relativeUrl}`)
