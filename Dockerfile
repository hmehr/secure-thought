# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build  # produces /dist

# --- Serve stage ---
FROM nginx:alpine

ENV WEBROOT=/usr/share/nginx/html
ENV PORT=8080

# copy the built app
COPY --from=build /app/dist ${WEBROOT}

RUN printf 'server {\n\
  listen 0.0.0.0:${PORT};\n\
  server_name _;\n\
  root '"${WEBROOT}"';\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/templates/site.conf.template

CMD /bin/sh -c 'envsubst < /etc/nginx/templates/site.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g "daemon off;"'

EXPOSE 8080