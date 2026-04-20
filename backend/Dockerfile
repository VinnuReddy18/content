# Stage 1: Build
FROM node:20-bullseye-slim AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Use node from Playwright image (it comes with Node 20)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=production
# The app and worker entrypoints
# For the main API: CMD ["npm", "start"]
# For the worker: CMD ["npm", "run", "worker"]
