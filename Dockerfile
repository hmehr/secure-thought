# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY app/ .
RUN npm run build

# Serve static
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: SPA-friendly config (fallback to /index.html)
RUN printf 'server { \
  listen 80; \
  server_name _; \
  root /usr/share/nginx/html; \
  location / { try_files $uri /index.html; } \
} \
' > /etc/nginx/conf.d/default.conf