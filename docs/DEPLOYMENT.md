# Deployment Guide

## Prerequisites

1. **System Requirements**
   - Ubuntu 20.04 LTS or later
   - Python 3.8 or later
   - Node.js 14.x or later
   - PostgreSQL 12 or later
   - Redis 6.x or later
   - Nginx

2. **Required Tools**
   - Git
   - Docker (optional)
   - Docker Compose (optional)
   - Certbot (for SSL)

## Environment Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd schoolsoftware
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Configuration

1. **Environment Variables**
   Create `.env` file in backend directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/school_db
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=your-secret-key
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
   ```

2. **Database Setup**
   ```bash
   psql -U postgres
   CREATE DATABASE school_db;
   CREATE USER school_user WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE school_db TO school_user;
   ```

3. **Nginx Configuration**
   Create `/etc/nginx/sites-available/schoolsoftware`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /static/ {
           alias /path/to/static/files/;
       }
   }
   ```

## Deployment Steps

1. **Backend Deployment**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   npm run build
   ```

3. **Database Migrations**
   ```bash
   cd backend
   alembic upgrade head
   ```

4. **SSL Setup**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Docker Deployment (Optional)

1. **Build Images**
   ```bash
   docker-compose build
   ```

2. **Run Containers**
   ```bash
   docker-compose up -d
   ```

## Monitoring

1. **Logs**
   ```bash
   # Backend logs
   journalctl -u schoolsoftware-backend

   # Nginx logs
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

2. **Process Management**
   ```bash
   # Using systemd
   sudo systemctl start schoolsoftware-backend
   sudo systemctl status schoolsoftware-backend
   ```

## Backup and Recovery

1. **Database Backup**
   ```bash
   pg_dump -U school_user school_db > backup.sql
   ```

2. **Restore Database**
   ```bash
   psql -U school_user school_db < backup.sql
   ```

## Scaling

1. **Horizontal Scaling**
   - Use load balancer (Nginx)
   - Multiple backend instances
   - Database replication

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database queries
   - Use caching (Redis)

## Maintenance

1. **Regular Updates**
   ```bash
   # Update dependencies
   pip install -r requirements.txt --upgrade
   npm update

   # Apply migrations
   alembic upgrade head
   ```

2. **Monitoring**
   - Set up monitoring tools (Prometheus, Grafana)
   - Configure alerts
   - Regular health checks

## Troubleshooting

1. **Common Issues**
   - Database connection issues
   - Memory leaks
   - Performance bottlenecks

2. **Debugging**
   ```bash
   # Check logs
   journalctl -u schoolsoftware-backend -f

   # Check database
   psql -U school_user school_db

   # Check Redis
   redis-cli ping
   ```

## Rollback Procedure

1. **Code Rollback**
   ```bash
   git checkout <previous-version>
   docker-compose down
   docker-compose up -d
   ```

2. **Database Rollback**
   ```bash
   alembic downgrade -1
   ```

## Contact Information

For deployment issues, contact:
- System Administrator: admin@example.com
- Technical Support: support@example.com 