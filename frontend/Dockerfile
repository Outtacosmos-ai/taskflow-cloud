FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
# Remove ALL default configs
RUN rm -rf /etc/nginx/conf.d/*
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy to a safe location
COPY nginx.custom.conf /etc/nginx/nginx.conf
EXPOSE 80
# Force Nginx to use our file and skip all entrypoint logic
CMD ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
