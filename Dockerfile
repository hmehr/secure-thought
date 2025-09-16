# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm ci

# Copy only what's needed to build
COPY tsconfig*.json vite.config.* index.html ./
COPY src ./src
COPY public ./public

RUN npm run build  # produces /dist

# --- Serve stage ---
FROM nginx:alpine

ENV PORT=8080

# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config
RUN echo 'server { \n\
    listen 0.0.0.0:'"$PORT"'; \n\
    listen [::]:'"$PORT"'; \n\
    server_name _; \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    \n\
    port_in_redirect off; \n\
    absolute_redirect off; \n\
    server_name_in_redirect off; \n\
    \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \n\
        expires 1y; \n\
        add_header Cache-Control "public, immutable"; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

# Remove the default nginx config
RUN rm -f /etc/nginx/nginx.conf

# Create a new main nginx config
RUN echo 'user nginx; \n\
worker_processes auto; \n\
error_log /var/log/nginx/error.log warn; \n\
pid /var/run/nginx.pid; \n\
\n\
events { \n\
    worker_connections 1024; \n\
} \n\
\n\
http { \n\
    include /etc/nginx/mime.types; \n\
    default_type application/octet-stream; \n\
    \n\
    sendfile on; \n\
    keepalive_timeout 65; \n\
    \n\
    # Disable port in redirects globally \n\
    port_in_redirect off; \n\
    absolute_redirect off; \n\
    server_name_in_redirect off; \n\
    \n\
    include /etc/nginx/conf.d/*.conf; \n\
}' > /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]