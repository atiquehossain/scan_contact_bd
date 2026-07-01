FROM node:22-alpine AS web_builder
WORKDIR /app

ARG NEXT_PUBLIC_APP_NAME="NoNumQR"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_API_URL="/api"
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace @nonumqr/web --include-workspace-root

COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build

FROM caddy:2-alpine
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=web_builder /app/apps/web/out /srv/nonumqr
