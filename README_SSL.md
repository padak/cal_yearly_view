# SSL Setup with Let's Encrypt

This document describes the SSL/HTTPS setup for the Calendar Year View application.

## Overview

The application uses Let's Encrypt for SSL certificates, with the following components:
- Nginx as the web server
- Certbot for certificate management
- Docker for containerization

## Initial Setup

1. Create required directories:
```bash
mkdir -p certbot/conf certbot/data
```

2. Configure firewall rules (Google Cloud):
```bash
# Allow HTTP for initial certificate generation
gcloud compute firewall-rules create allow-calendar-http \
    --allow tcp:80 \
    --description="Allow incoming HTTP traffic for Calendar app" \
    --direction=INGRESS

# Allow HTTPS for secure traffic
gcloud compute firewall-rules create allow-calendar-https \
    --allow tcp:443 \
    --description="Allow incoming HTTPS traffic for Calendar app" \
    --direction=INGRESS
```

3. Start the application:
```bash
sudo docker compose up -d
```

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. To manually renew:

```bash
sudo docker compose run --rm certbot
```

## Configuration Files

- `frontend/nginx.conf`: Contains the Nginx configuration with SSL settings
- `docker-compose.yml`: Contains the Docker configuration including certificate volume mounts
- `.gitignore`: Excludes SSL certificates and Certbot data

## Security Notes

1. Never commit SSL certificates to the repository
2. Keep your `.env` files secure and never commit them
3. Regularly update dependencies and Docker images
4. Monitor certificate expiration dates

## Troubleshooting

1. Certificate Issues:
   - Check Certbot logs: `docker compose logs certbot`
   - Verify certificate paths in nginx.conf
   - Ensure ports 80 and 443 are open

2. Nginx Issues:
   - Check Nginx logs: `docker compose logs frontend`
   - Verify SSL certificate paths
   - Check file permissions in certbot directories 