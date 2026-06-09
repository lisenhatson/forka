#!/bin/bash
# Self-signed certificate generator for ForKa WAF
# Usage: bash gen_cert.sh [domain]
# Default domain: localhost

DOMAIN=${1:-localhost}
DAYS=365
OUT_DIR="./certs"

mkdir -p "$OUT_DIR"

echo "Generating self-signed cert for: $DOMAIN"

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$OUT_DIR/selfsigned.key" \
  -out "$OUT_DIR/selfsigned.crt" \
  -days $DAYS \
  -subj "/C=ID/ST=Riau/L=Batam/O=Polibatam/OU=ForKa/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,IP:127.0.0.1"

echo ""
echo "Done. Files written to $OUT_DIR/"
echo "  Certificate: $OUT_DIR/selfsigned.crt"
echo "  Private key: $OUT_DIR/selfsigned.key"
echo ""
echo "Mount these into your WAF container:"
echo "  volumes:"
echo "    - $OUT_DIR/selfsigned.crt:/etc/nginx/conf.d/server.crt:ro"
echo "    - $OUT_DIR/selfsigned.key:/etc/nginx/conf.d/server.key:ro"
