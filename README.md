# blog-new

静态文章 + 动态索引的个人博客。

文章页是完整的单文件 HTML，由 Skill 生成并直接上传到服务器目录；首页和分类页由一个很薄的 Vite + React SSR 服务实时扫描文章目录生成。发布新文章不需要重新生成或上传 `/blog/` 首页。

## 路径约定

博客默认挂载在 `/blog/`：

```text
/blog/                                 -> Node SSR 首页
/blog/<category>/                      -> Node SSR 分类页
/blog/<category>/<YYYY-MM-DD-slug>.html -> Nginx 直接托管文章
```

示例：

```text
/blog/ai/2026-07-02-agentic-coding.html
/blog/frontend/2026-07-02-react-cache.html
```

一级目录是分类，文件名前 10 位日期用于排序。首页会从 HTML 中读取 `<title>`、`<meta name="description">` 或 `<h1>` / 首段文本。

## 常用命令

本地预览 SSR 首页和静态文章：

```bash
npm run serve
```

默认地址：

```text
http://localhost:3436/blog/
```

构建线上 SSR renderer：

```bash
npm run build
```

运行生产 SSR 服务：

```bash
npm run start
```

## 发布文章

主链路由 Skill 完成：

```text
生成完整 HTML -> 上传到 /var/www/blog/<category>/<YYYY-MM-DD-slug>.html -> 完成
```

不要上传或维护 `index.html`，`/blog/` 首页由 Node SSR 服务访问时动态生成。

## 迁移旧博客

从旧 Next.js 博客迁移已发布文章：

```bash
npm run migrate:old
```

脚本会读取 `/Users/bytedance/workspace/study/blog/data/blog/**/*.md`，跳过 `draft: true`，并按 `article-to-html` 的 paper proposal 样式生成单文件 HTML：

```text
public/<first-tag>/<YYYY-MM-DD-source-slug>.html
```

旧文章里的本地图片会内联为 data URI，避免迁移后还依赖旧仓库静态资源。

## 环境变量

复制示例配置：

```bash
cp .env.example .env
```

关键配置：

```env
BLOG_BASE_URL=https://example.com
BLOG_BASE_PATH=/blog
BLOG_CONTENT_DIR=/var/www/blog
```

本地未配置时，SSR 服务默认扫描仓库内的 `public/`。

## Nginx 示例

文章 HTML 直接静态返回，首页和分类页转给 Node：

```nginx
location = /blog {
  return 301 /blog/;
}

location ~ ^/blog/(.+\.html)$ {
  alias /var/www/blog/$1;
}

location /blog/ {
  proxy_pass http://127.0.0.1:3436;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Node SSR 服务需要设置：

```env
BLOG_CONTENT_DIR=/var/www/blog
BLOG_BASE_PATH=/blog
```

## Docker 部署

服务器上构建并启动 SSR 首页服务：

```bash
docker compose up -d --build
```

`compose.yml` 默认把宿主机 `BLOG_CONTENT_DIR=/var/www/blog` 挂载到容器内 `/data/blog`，容器只监听本机 `127.0.0.1:3436`，由 Nginx 反向代理 `/blog/` 首页和分类页。
