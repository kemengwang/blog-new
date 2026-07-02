# AGENTS.md

## Project Overview

This is a zero-dependency static blog publisher. AI tools generate HTML fragments, `npm run new` wraps them in a stable article template, `npm run build` regenerates the homepage, and `npm run publish` uploads `public/` to a server directory served by Nginx or another static server.

## Commands

- `npm run new -- --title "..." --summary "..." --tags "A,B" --content-file ./draft.html`: create a new post.
- `npm run new -- --title "..." --summary "..." --stdin`: create a post from stdin.
- `npm run build`: regenerate `public/index.html` from `content/posts.json`.
- `npm run serve`: preview `public/` at `http://localhost:3436`.
- `npm run publish`: upload `public/` to the server configured in `.env`.

## File Layout

- `content/posts.json`: article index used to build the homepage.
- `public/posts/YYYY/*.html`: generated post pages.
- `public/index.html`: generated homepage.
- `src/lib/`: reusable script helpers.
- `src/scripts/`: command entry points.

## Editing Rules

- Keep scripts dependency-free unless a task clearly needs a package.
- Store complete generated HTML pages under `public/posts/`; do not require a runtime server.
- Keep `content/posts.json` small and explicit: title, summary, date, tags, slug, url.
- Do not hand-edit generated post files for normal publishing; update the source content and rerun the script.
- Keep `.env` local and out of git.
