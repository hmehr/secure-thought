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

# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config file directly
RUN cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 8080;
    listen [::]:8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Prevent port in redirects
    port_in_redirect off;
    absolute_redirect off;
    server_name_in_redirect off;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Remove the default nginx welcome page config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]