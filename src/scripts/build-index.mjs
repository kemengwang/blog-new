import fs from 'node:fs'
import path from 'node:path'
import { ensureProjectDirs, publicDir } from '../lib/config.mjs'
import { renderIndexPage } from '../lib/html.mjs'
import { readPosts } from '../lib/posts.mjs'

ensureProjectDirs()

const posts = readPosts()
const html = renderIndexPage(posts)
const outputPath = path.join(publicDir, 'index.html')

fs.writeFileSync(outputPath, html)
console.log(`Generated ${outputPath}`)
