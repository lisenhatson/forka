# Apache Dockerfile
FROM httpd:2.4-alpine

# Install required modules
RUN apk add --no-cache \
    openssl \
    curl

# Enable necessary modules
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule ssl_module/LoadModule ssl_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /usr/local/apache2/conf/httpd.conf

# Copy configuration
COPY infra/apache/forka.conf /usr/local/apache2/conf/extra/
RUN echo "Include conf/extra/forka.conf" >> /usr/local/apache2/conf/httpd.conf

# Create directories
RUN mkdir -p /var/www/static /var/www/media /etc/apache2/ssl

# Generate self-signed SSL certificate (for development)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/apache2/ssl/forka.key \
    -out /etc/apache2/ssl/forka.crt \
    -subj "/C=ID/ST=Riau/L=Batam/O=ForKa/OU=IT/CN=localhost"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose ports
EXPOSE 80 443

# Start Apache
CMD ["httpd-foreground"]