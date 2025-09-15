# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /web

# copy only manifests first for better layer caching
COPY package*.json ./
RUN npm ci

# now copy the rest of the frontend (root contains src/, public/, vite config, etc.)
COPY . .
RUN npm run build

# --- Runtime stage (serve static with nginx) ---
FROM nginx:alpine

# copy built assets
COPY --from=build /web/dist /usr/share/nginx/html

# SPA fallback to /index.html
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  location / { try_files $uri /index.html; }\n\
}\n' > /etc/nginx/conf.d/default.conf