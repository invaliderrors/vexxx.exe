# VEXXX platform — single root Dockerfile, one build target per app.
#
# Build context is ALWAYS the repo root (pnpm/Nx monorepo — apps depend on
# libs/contracts + libs/money). Default target (last stage) is the storefront.
#
#   docker build -t vexxx-storefront .                      # storefront (default)
#   docker build --target storefront -t vexxx-storefront .  # explicit
#   docker compose up --build                               # via compose network
#
# Later passes add `api` and `dashboard` runtime targets on the shared
# `workspace` stage, and enable their services in docker-compose.yml.

# --- shared workspace: install once, build any app from here ---------------
FROM node:22-alpine AS workspace
WORKDIR /app
ENV NX_DAEMON=false CI=1
# packageManager in package.json pins the exact pnpm version for corepack.
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

# --- storefront: prerendered Astro build ------------------------------------
FROM workspace AS storefront-build
# Nx builds libs first (build dependsOn ^build), then the storefront.
RUN pnpm nx run @vexxx/storefront:build

# --- storefront runtime: static nginx (default target) ----------------------
FROM nginx:1.27-alpine AS storefront
COPY apps/storefront/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=storefront-build /app/apps/storefront/dist/client /usr/share/nginx/html
EXPOSE 80
