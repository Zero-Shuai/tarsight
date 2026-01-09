# Deployment Guide

Complete guide for deploying Tarsight to production.

## Quick Start

### GitHub Actions (Recommended)

1. **Add GitHub Secrets:**

   Go to Repository Settings → Secrets and Variables → Actions

   | Secret Name | Description | Example |
   |-------------|-------------|---------|
   | `PRODUCTION_HOST` | Server IP or hostname | `192.168.1.100` or `tarsight.example.com` |
   | `PRODUCTION_USER` | SSH username | `root` or `tarsight` |
   | `PRODUCTION_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
   | `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGci...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `eyJhbGci...` |
   | `PROJECT_ID` | Project UUID | `uuid-here` |

2. **Push to Master:**

   ```bash
   git add .
   git commit -m "feat: deploy changes"
   git push origin master
   ```

   GitHub Actions will automatically deploy to production.

3. **Monitor Deployment:**

   Go to Actions tab in GitHub to view deployment progress.

### Skip Type Checking

Add `[no-lint]` to commit message:

```bash
git commit -m "feat: hotfix [no-lint]"
git push origin master
```

## Manual Deployment

### Standard Update

```bash
# SSH into production server
ssh user@production-host

# Navigate to project
cd /opt/tarsight

# Pull latest code
git pull origin master

# Rebuild and restart
docker compose up -d --build

# Check logs
docker compose logs -f frontend
```

### Using Update Script

```bash
# Standard update (includes type check)
sudo bash scripts/update-production.sh

# Skip type checking
sudo bash scripts/update-production.sh --no-lint

# Verbose output
sudo bash scripts/update-production.sh --verbose
```

## Initial Server Setup

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Clone Repository

```bash
# Create project directory
sudo mkdir -p /opt/tarsight
sudo chown $USER:$USER /opt/tarsight

# Clone repository
git clone git@github.com:your-org/tarsight.git /opt/tarsight
cd /opt/tarsight
```

### 3. Configure Environment

```bash
# Create production environment file
cat > .env.production << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PROJECT_ID=your-project-uuid
EOF

# Secure the file
chmod 600 .env.production
```

### 4. Configure Docker

```bash
# Copy environment for Docker
cp .env.production .env

# Build and start
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### 5. Configure Nginx (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo tee /etc/nginx/sites-available/tarsight << EOF
server {
    listen 80;
    server_name tarsight.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/tarsight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tarsight.example.com
```

## Health Monitoring

### Health Check Script

```bash
# Basic health check
bash scripts/health-check.sh

# Verbose mode
bash scripts/health-check.sh --verbose
```

### Manual Health Checks

```bash
# Check Docker containers
docker compose ps

# Check frontend is responding
curl -I http://localhost:3000

# Check logs
docker compose logs --tail=100 frontend

# Check disk space
df -h

# Check memory
free -h
```

## Backup Strategy

### Database Backup

```bash
# Backup Supabase database
supabase db dump -f backup_$(date +%Y%m%d).sql

# Or use pg_dump directly
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Application Backup

```bash
# Backup code and configuration
cd /opt/tarsight
tar -czf tarsight_backup_$(date +%Y%m%d).tar.gz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='supabase_version/.venv' \
  .
```

### Automated Backup Script

```bash
# Create backup script
cat > /opt/tarsight/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/tarsight"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
supabase db dump -f $BACKUP_DIR/db_$DATE.sql

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt/tarsight \
  --exclude='.git' --exclude='node_modules' .

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/tarsight/scripts/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/tarsight/scripts/backup.sh
```

## Rollback Procedure

### Quick Rollback

```bash
# View recent commits
git log --oneline -10

# Reset to previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker compose up -d --build
```

### Database Rollback

```bash
# Restore from backup
supabase db restore -f backup_20250109.sql

# Or manually
psql $DATABASE_URL < backup_20250109.sql
```

## Troubleshooting Deployment

### Container Won't Start

```bash
# Check logs
docker compose logs frontend

# Common issues:
# 1. Port conflict
lsof -i :3000

# 2. Missing environment variables
docker compose exec frontend env | grep NEXT_PUBLIC

# 3. Build failure
docker compose build --no-cache frontend
```

### GitHub Actions Fails

```bash
# Test SSH connection manually
ssh -i ~/.ssh/production_key user@host

# Verify secrets are set correctly
# Go to GitHub repo → Settings → Secrets

# Check deployment script locally
sudo bash scripts/update-production.sh --dry-run
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase Docker resources
# Edit /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ufw)
- [ ] Setup SSL/TLS certificates
- [ ] Restrict SSH access (key-based only)
- [ ] Enable RLS on all Supabase tables
- [ ] Rotate secrets regularly
- [ ] Enable GitHub branch protection
- [ ] Setup monitoring/alerting
- [ ] Regular security updates
