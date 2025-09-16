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

ENV WEBROOT=/usr/share/nginx/html
ENV PORT=8080

# Copy the built app
COPY --from=build /app/dist/ ${WEBROOT}

# Create template dir and write nginx site with proper proxy headers
RUN mkdir -p /etc/nginx/templates && \
    printf 'server {\n\
  listen 0.0.0.0:${PORT};\n\
  server_name _;\n\
  root '"${WEBROOT}"';\n\
  index index.html;\n\
  \n\
  # Important: Tell nginx it is behind a proxy\n\
  port_in_redirect off;\n\
  absolute_redirect off;\n\
  \n\
  # Handle proxy headers\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
    \n\
    # Ensure proper headers for proxied requests\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto $scheme;\n\
  }\n\
}\n' > /etc/nginx/templates/site.conf.template

CMD /bin/sh -c 'envsubst < /etc/nginx/templates/site.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g "daemon off;"'

EXPOSE 8080