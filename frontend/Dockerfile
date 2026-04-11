# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
# CHANGED: Bumped from 1.25 to 1.27 to pull a modern, secure Alpine OS
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]