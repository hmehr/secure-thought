# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_PASSAGE_APP_ID
ARG VITE_API_BASE_URL
ARG VITE_DEV_AUTH

ENV VITE_PASSAGE_APP_ID=${VITE_PASSAGE_APP_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_DEV_AUTH=${VITE_DEV_AUTH}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine

RUN apk add --no-cache gettext


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