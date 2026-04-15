FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
# Wipe existing configs
RUN rm -rf /etc/nginx/conf.d/*
COPY --from=builder /app/dist /usr/share/nginx/html
# Overwrite the MAIN config
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
