# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine

# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo '#!/bin/sh\n\
cat > /etc/nginx/conf.d/default.conf <<EOF\n\
server {\n\
    listen ${PORT:-80};\n\
    listen [::]:${PORT:-80};\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    port_in_redirect off;\n\
    absolute_redirect off;\n\
    server_name_in_redirect off;\n\
    \n\
    location / {\n\
        try_files \$uri /index.html;\n\
    }\n\
}\n\
EOF\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]