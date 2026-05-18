FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql \
    && a2enmod rewrite headers

COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

COPY api/ /var/www/html/api/
COPY --from=frontend-build /app/frontend/dist/ /var/www/html/

RUN mkdir -p \
    /var/www/html/api/uploads/avatars \
    /var/www/html/api/uploads/banners \
    /var/www/html/api/uploads/thumbnails \
    /var/www/html/api/uploads/videos \
    && chown -R www-data:www-data /var/www/html/api/uploads

EXPOSE 80
