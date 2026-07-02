FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3436
ENV BLOG_BASE_PATH=/blog
ENV BLOG_CONTENT_DIR=/data/blog

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY src ./src

EXPOSE 3436
CMD ["node", "src/server/index.mjs"]
