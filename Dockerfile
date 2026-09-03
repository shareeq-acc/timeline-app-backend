# Navigo / timeline — Express API.
#
# Three stages, so the image ships the compiled JavaScript and the production
# dependencies, and none of the TypeScript, tests or build tooling.
#
# The schema looks after itself: `setupDatabase()` runs its CREATE TABLE IF NOT
# EXISTS statements at boot, so there is no migration step to run before this
# starts, and a database that is already up to date is a no-op.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# A second, production-only install rather than pruning the first: `npm ci`
# against the same lockfile is reproducible, where `npm prune` leaves whatever
# the build happened to hoist.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 express \
 && chown -R express:nodejs /app
USER express

EXPOSE 3000
ENV PORT=3000

# `dist/src/server.js`, not `dist/server.js`. tsconfig sets rootDir to the
# project root, so the compiler mirrors the whole tree under dist — which is
# why `npm start` has always been wrong here. It went unnoticed because Vercel
# builds `api/index.ts` as a serverless function and never runs the start
# script at all.
CMD ["node", "dist/src/server.js"]
