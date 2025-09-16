# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine

RUN apk add --no-cache gettext

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

RUN mkdir -p /etc/nginx/templates && \
    echo 'server { \
        listen $PORT; \
        server_name _; \
        root /usr/share/nginx/html; \
        index index.html; \
        port_in_redirect off; \
        absolute_redirect off; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
    }' > /etc/nginx/templates/default.conf.template

CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"