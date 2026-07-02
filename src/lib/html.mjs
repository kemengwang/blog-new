export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function stripDangerousHtml(html) {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
}

export function siteStyles() {
  return `
    :root {
      color-scheme: light dark;
      --bg: #f7f7f5;
      --fg: #1d1d1f;
      --muted: #6e6e73;
      --line: #d8d8d8;
      --card: #ffffff;
      --accent: #2563eb;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111113;
        --fg: #f5f5f7;
        --muted: #a1a1aa;
        --line: #2f2f35;
        --card: #18181b;
        --accent: #60a5fa;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.7;
    }

    a {
      color: var(--accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .site {
      width: min(900px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 64px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      margin-bottom: 48px;
      color: var(--muted);
      font-size: 14px;
    }

    .brand {
      color: var(--fg);
      font-weight: 700;
    }

    .hero {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 6vw, 56px);
      line-height: 1.08;
      letter-spacing: 0;
    }

    h2 {
      margin-top: 40px;
      line-height: 1.25;
    }

    h3 {
      margin-top: 28px;
      line-height: 1.3;
    }

    p {
      margin: 16px 0;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    pre {
      overflow: auto;
      padding: 16px;
      border-radius: 8px;
      background: #101014;
      color: #f4f4f5;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.92em;
    }

    .meta,
    .summary,
    .empty {
      color: var(--muted);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .tag {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px 10px;
      color: var(--muted);
      font-size: 13px;
    }

    .post-list {
      display: grid;
      gap: 16px;
    }

    .post-card {
      display: block;
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      color: var(--fg);
    }

    .post-card:hover {
      text-decoration: none;
      border-color: var(--accent);
    }

    .post-card h2 {
      margin: 0 0 8px;
      font-size: 22px;
    }

    article {
      font-size: 18px;
    }

    blockquote {
      margin: 24px 0;
      padding-left: 18px;
      border-left: 4px solid var(--line);
      color: var(--muted);
    }
  `
}

export function renderPostPage(post, contentHtml) {
  const safeContent = stripDangerousHtml(contentHtml)
  const tags = post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(post.title)}</title>
  <meta name="description" content="${escapeHtml(post.summary)}">
  <style>${siteStyles()}</style>
</head>
<body>
  <main class="site">
    <nav class="topbar">
      <a class="brand" href="/">Blog</a>
      <a href="/">Home</a>
    </nav>
    <article>
      <header class="hero">
        <div class="meta">${escapeHtml(post.date)}</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="summary">${escapeHtml(post.summary)}</p>
        <div class="tags">${tags}</div>
      </header>
      ${safeContent}
    </article>
  </main>
</body>
</html>
`
}

export function renderIndexPage(posts) {
  const cards = posts
    .map((post) => {
      const tags = post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')

      return `<a class="post-card" href="${escapeHtml(post.url)}">
  <div class="meta">${escapeHtml(post.date)}</div>
  <h2>${escapeHtml(post.title)}</h2>
  <p class="summary">${escapeHtml(post.summary)}</p>
  <div class="tags">${tags}</div>
</a>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog</title>
  <meta name="description" content="Personal blog">
  <style>${siteStyles()}</style>
</head>
<body>
  <main class="site">
    <nav class="topbar">
      <a class="brand" href="/">Blog</a>
      <span>Static notes and summaries</span>
    </nav>
    <header class="hero">
      <h1>Blog</h1>
      <p class="summary">AI-assisted notes, summaries, and technical writing.</p>
    </header>
    <section class="post-list">
      ${cards || '<p class="empty">No posts yet.</p>'}
    </section>
  </main>
</body>
</html>
`
}
