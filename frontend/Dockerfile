FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Explicitly set environment variables for build
# Railway will inject these automatically, but we make them available to Next.js
ENV NEXT_PUBLIC_API_URL=https://cloud-forest-production.up.railway.app
ENV NEXT_PUBLIC_SOCKET_URL=https://cloud-forest-production.up.railway.app

# Build the application
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]