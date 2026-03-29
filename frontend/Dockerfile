FROM node:22.14.0-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27.4-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY env.template.js /usr/share/nginx/html/env.template.js
COPY docker-entrypoint.d/40-write-env.sh /docker-entrypoint.d/40-write-env.sh
RUN chmod +x /docker-entrypoint.d/40-write-env.sh
COPY --from=build /app/dist/frontend/browser ./
EXPOSE 80
