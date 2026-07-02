import fs from 'node:fs'
import path from 'node:path'
import { postsJsonPath } from './config.mjs'

export function readPosts() {
  if (!fs.existsSync(postsJsonPath)) {
    return []
  }

  const raw = fs.readFileSync(postsJsonPath, 'utf8').trim()

  if (!raw) {
    return []
  }

  const posts = JSON.parse(raw)

  if (!Array.isArray(posts)) {
    throw new Error('content/posts.json must contain an array')
  }

  return posts
}

export function writePosts(posts) {
  const sorted = [...posts].sort((a, b) => {
    const dateCompare = String(b.date).localeCompare(String(a.date))

    if (dateCompare !== 0) {
      return dateCompare
    }

    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  })

  fs.mkdirSync(path.dirname(postsJsonPath), { recursive: true })
  fs.writeFileSync(postsJsonPath, `${JSON.stringify(sorted, null, 2)}\n`)
}

export function upsertPost(post) {
  const posts = readPosts()
  const existingIndex = posts.findIndex((item) => item.slug === post.slug)

  if (existingIndex >= 0) {
    posts[existingIndex] = post
  } else {
    posts.push(post)
  }

  writePosts(posts)
}
