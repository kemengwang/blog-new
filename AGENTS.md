# AGENTS.md

## Project Overview

This is a static-article blog with a Vite React SSR index service. AI skills generate complete standalone article HTML files and upload them directly into the server article directory. Nginx serves article HTML files directly, while Node renders `/blog/` and category pages by scanning the article directory.

## Commands

- `npm run serve`: run the local SSR index service at `http://localhost:3436/blog/`.
- `npm run dev`: same as `serve`, with Vite middleware for React SSR source loading.
- `npm run build`: build the React SSR renderer into `dist/server/`.
- `npm run start`: run the production SSR service from `dist/server/`.
- `npm run publish`: optional full sync of `public/` to the server configured in `.env`.

## File Layout

- `public/<category>/<YYYY-MM-DD-slug>.html`: standalone article pages for local preview.
- `src/app/`: React SSR index UI.
- `src/server/`: Node SSR service and article-directory scanner.
- `src/lib/`: reusable script helpers.
- `src/scripts/`: command entry points.

## Editing Rules

- Article publishing is skill-driven: generate one complete HTML file and upload only that file to `BLOG_CONTENT_DIR`.
- Do not publish or maintain a static `public/index.html`; `/blog/` is rendered dynamically by the SSR service.
- Use `/blog/<category>/<YYYY-MM-DD-slug>.html` as the public URL shape.
- Keep article HTML self-contained: inline CSS/assets, no runtime server required for article pages.
- Do not add a database or `posts.json`; the index reads filenames and HTML metadata directly.
- Keep `.env` local and out of git.
