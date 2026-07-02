import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { getRuntimeConfig } from './content.mjs'
import { getCategories, scanPosts } from './scan-posts.mjs'

const isProduction = process.env.NODE_ENV === 'production'
const { basePath, contentDir, host, port } = getRuntimeConfig()
const vite = isProduction
  ? null
  : await createViteServer({
      appType: 'custom',
      server: { middlewareMode: true },
    })

function normalizePathname(url) {
  return decodeURIComponent(new URL(url || '/', `http://${host}:${port}`).pathname)
}

function stripBasePath(pathname) {
  if (!basePath) {
    return pathname
  }

  if (pathname === basePath) {
    return '/'
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || '/'
  }

  return ''
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' })
  response.end(text)
}

function sendHtml(response, html) {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  response.end(html)
}

function serveStaticHtml(response, pathname) {
  const relativePath = stripBasePath(pathname).replace(/^\/+/, '')
  const filePath = path.resolve(contentDir, relativePath)
  const root = path.resolve(contentDir)

  if (!filePath.startsWith(`${root}${path.sep}`)) {
    sendText(response, 400, 'Bad request')
    return
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : 'Server error')
      return
    }

    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(content)
  })
}

async function loadRenderer() {
  if (vite) {
    return vite.ssrLoadModule('/src/app/entry-server.jsx')
  }

  return import(pathToFileURL(path.resolve('dist/server/entry-server.js')).href)
}

async function renderIndex(response, category = '') {
  try {
    const posts = scanPosts({ contentDir, basePath })
    const categories = getCategories(posts)
    const { render } = await loadRenderer()

    sendHtml(response, render({ basePath, categories, currentCategory: category, posts }))
  } catch (error) {
    if (vite) {
      vite.ssrFixStacktrace(error)
    }

    console.error(error)
    sendText(response, 500, 'Server error')
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = normalizePathname(request.url)

  if (basePath && pathname === basePath) {
    response.writeHead(301, { location: `${basePath}/` })
    response.end()
    return
  }

  if (basePath && !pathname.startsWith(`${basePath}/`)) {
    sendText(response, 404, 'Not found')
    return
  }

  const routePath = stripBasePath(pathname)

  if (routePath.endsWith('.html')) {
    serveStaticHtml(response, pathname)
    return
  }

  if (routePath === '/' || routePath === '') {
    await renderIndex(response)
    return
  }

  const categoryMatch = routePath.match(/^\/([^/]+)\/$/)

  if (categoryMatch) {
    await renderIndex(response, categoryMatch[1])
    return
  }

  sendText(response, 404, 'Not found')
})

server.listen(port, host, () => {
  const urlBasePath = basePath ? `${basePath}/` : '/'
  console.log(`SSR index: http://${host}:${port}${urlBasePath}`)
  console.log(`Scanning articles from: ${contentDir}`)
})
