# VEXXX storefront — fully prerendered Astro site served by nginx.
#
# Build from the REPO ROOT (the workspace is a pnpm/Nx monorepo and the
# storefront depends on libs/contracts + libs/money):
#
#   docker build -f apps/storefront/Dockerfile -t vexxx-storefront .
#   docker run --rm -p 8080:80 vexxx-storefront

FROM node:22-alpine AS build
WORKDIR /app
ENV NX_DAEMON=false CI=1
# packageManager in package.json pins the exact pnpm version for corepack.
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
# Nx builds libs first (build dependsOn ^build), then the storefront.
RUN pnpm nx run @vexxx/storefront:build

FROM nginx:1.27-alpine
COPY apps/storefront/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/storefront/dist/client /usr/share/nginx/html
EXPOSE 80
