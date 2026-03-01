FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack (bundled with Node 20)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# ── Dev stage: serve Angular dev server ────────────────────
# Re-use the builder stage directly so node_modules are already present.
# Angular CLI is available as a local binary via pnpm (./node_modules/.bin/ng).
EXPOSE 4252
CMD ["./node_modules/.bin/ng", "serve", "--host", "0.0.0.0", "--port", "4252", "--disable-host-check"]
