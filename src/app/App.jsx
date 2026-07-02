function groupPostsByCategory(posts) {
  return posts.reduce((groups, post) => {
    groups[post.category] ||= []
    groups[post.category].push(post)
    return groups
  }, {})
}

function categoryHref(basePath, category) {
  return `${basePath || ''}/${category}/`.replace(/\/{2,}/g, '/')
}

export function App({ basePath = '/blog', categories = [], currentCategory = '', posts = [] }) {
  const visiblePosts = currentCategory ? posts.filter((post) => post.category === currentCategory) : posts
  const groupedPosts = groupPostsByCategory(visiblePosts)
  const pageTitle = currentCategory ? `${currentCategory} · Blog` : 'Blog'
  const latestDate = posts[0]?.date || 'EMPTY'

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content="AI-assisted notes and article archive." />
        <style>{styles}</style>
      </head>
      <body>
        <main className="doc">
          <header className="doc-header">
            <div className="doc-eyebrow">
              <span className="mascot"></span>
              Static Blog · Dynamic Index
            </div>
            <h1 className="doc-title">{currentCategory || 'Article Archive'}</h1>
            <p className="doc-subtitle">Skill 生成单篇 HTML；索引页实时扫描目录，不发布首页。</p>
            <div className="doc-meta">
              <span>POSTS · {visiblePosts.length}</span>
              <span>CATEGORIES · {categories.length}</span>
              <span>LATEST · {latestDate}</span>
            </div>
            <nav className="categories" aria-label="Categories">
              <a className={!currentCategory ? 'active' : ''} href={`${basePath || '/'}/`.replace(/\/{2,}/g, '/')}>
                All
              </a>
              {categories.map((category) => (
                <a className={currentCategory === category ? 'active' : ''} href={categoryHref(basePath, category)} key={category}>
                  {category}
                </a>
              ))}
            </nav>
          </header>

          <div className="tldr">
            <div className="tldr-label">INDEX MODEL</div>
            <p>
              文章文件由 Skill 直接上传；这里实时扫描静态 HTML 目录生成索引，不需要重新发布首页。
            </p>
          </div>

          {visiblePosts.length === 0 ? (
            <p className="empty">No articles found.</p>
          ) : (
            Object.entries(groupedPosts).map(([category, items], index) => (
              <section className="group" key={category}>
                <h2>
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  {currentCategory || category}
                </h2>
                <div className="post-list">
                  {items.map((post) => (
                    <article className="post-card" key={post.path}>
                      <a href={post.url}>
                        <div className="post-meta">
                          <span>{post.date}</span>
                          <span>{post.category}</span>
                        </div>
                        <h3>{post.title}</h3>
                        {post.summary && <p>{post.summary}</p>}
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </body>
    </html>
  )
}

const styles = `
:root {
  --paper: #f7f7f5;
  --paper-edge: #efefea;
  --ink: #1a1a1a;
  --ink-soft: #4a4a4a;
  --ink-faint: #7a7a7a;
  --rule: #d8d8d2;
  --rule-soft: #e8e8e2;
  --accent: #6f9bb8;
  --accent-soft: #d9e6f0;
  --accent-faint: #eef4f8;
  --code-bg: #ececea;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html { font-size: 16px; }

body {
  background: var(--paper);
  color: var(--ink);
  font-family:
    ui-serif, "Charter", "Iowan Old Style", "Source Serif Pro", Georgia,
    "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding: 64px 24px 96px;
}

a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent-soft);
}

a:hover { border-bottom-color: var(--accent); }

.doc {
  max-width: 840px;
  margin: 0 auto;
}

.doc-header {
  border-bottom: 1px solid var(--rule);
  margin-bottom: 48px;
  padding-bottom: 28px;
}

.doc-eyebrow,
.doc-meta,
.categories,
.tldr-label,
.num,
.post-meta {
  font-family:
    ui-monospace, "SF Mono", Menlo,
    "PingFang SC", "Hiragino Sans GB", monospace;
}

.doc-eyebrow {
  align-items: center;
  color: var(--ink-faint);
  display: flex;
  font-size: 11px;
  gap: 8px;
  letter-spacing: 0.12em;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.mascot {
  background: var(--accent);
  display: inline-block;
  height: 8px;
  width: 8px;
}

.doc-title {
  font-family:
    ui-serif, Charter, Georgia,
    "Songti SC", "Source Han Serif SC", serif;
  font-size: 34px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
}

.doc-subtitle {
  color: var(--ink-soft);
  font-size: 16px;
  font-style: italic;
  margin-top: 10px;
}

.doc-meta {
  color: var(--ink-faint);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  gap: 24px;
  margin-top: 18px;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  margin-top: 24px;
}

.categories a {
  border-bottom: 0;
  border: 1px solid var(--rule);
  border-radius: 999px;
  color: var(--ink-soft);
  padding: 4px 10px;
}

.categories a.active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.tldr {
  background: var(--accent-faint);
  border-left: 2px solid var(--accent);
  font-size: 15px;
  margin-bottom: 56px;
  padding: 20px 24px;
}

.tldr-label {
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.tldr p { margin: 0; }

.group {
  margin-bottom: 56px;
}

h2 {
  border-bottom: 1px solid var(--rule);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0;
  margin-bottom: 18px;
  padding-bottom: 10px;
}

h2 .num {
  color: var(--ink-faint);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-right: 14px;
}

.post-list {
  display: grid;
  gap: 12px;
}

.post-card a {
  display: block;
  border: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.52);
  color: var(--ink);
  padding: 18px 22px;
}

.post-card a:hover {
  border-color: var(--accent);
  background: var(--accent-faint);
}

.post-meta {
  color: var(--ink-faint);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  gap: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.post-card h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
  margin: 7px 0 8px;
}

.post-card p,
.empty {
  color: var(--ink-soft);
  margin: 0;
}

@media (max-width: 680px) {
  body { padding: 40px 18px 72px; }
  .doc-title { font-size: 30px; }
  .doc-meta { gap: 10px 18px; }
}
`
