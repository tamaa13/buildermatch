FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
# PORT is supplied by the host (Render assigns one dynamically). Defaulting
# here lets the container run standalone without affecting cloud deploys.
ENV PORT=3001
EXPOSE 3001

CMD ["bun", "src/index.ts"]
