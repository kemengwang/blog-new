FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3436
ENV BLOG_BASE_PATH=/blog
ENV BLOG_CONTENT_DIR=/data/blog

COPY package.json package-lock.json ./
COPY node_modules/react ./node_modules/react
COPY node_modules/react-dom ./node_modules/react-dom
COPY node_modules/scheduler ./node_modules/scheduler
COPY dist ./dist
COPY src ./src

EXPOSE 3436
CMD ["node", "src/server/index.mjs"]
