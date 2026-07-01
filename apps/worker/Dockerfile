FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/worker/package.json apps/worker/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspace @nonumqr/worker --workspace @nonumqr/api --include-workspace-root

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY apps/api/prisma ./apps/api/prisma
COPY apps/worker ./apps/worker
WORKDIR /app/apps/api
RUN npx prisma generate
WORKDIR /app/apps/worker
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
RUN chown -R node:node /app/apps/worker
WORKDIR /app/apps/worker
USER node
CMD ["node", "dist/worker.js"]
