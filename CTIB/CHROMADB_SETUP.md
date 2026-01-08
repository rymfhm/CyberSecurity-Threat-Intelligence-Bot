# ChromaDB Setup Instructions

## The Issue

ChromaDB version 1.8+ requires a server to be running. There is no true "in-memory" mode that works without a server.

## Solution: Start ChromaDB with Docker

### Option 1: Start ChromaDB Server (Recommended)

1. **Start ChromaDB using Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Verify it's running**:
   ```bash
   docker ps
   ```
   You should see a `chromadb` container running.

3. **Update your `.env` file** to uncomment the ChromaDB URL:
   ```env
   CHROMADB_URL=http://localhost:8000
   ```

4. **Run the ingestion again**:
   ```bash
   npm run ingest
   ```

### Option 2: Install Docker Desktop

If you don't have Docker installed:

1. **Download Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Install and start Docker Desktop**
3. **Then follow Option 1 above**

### Option 3: Use ChromaDB Cloud (Alternative)

If you prefer a cloud-hosted solution, you can use ChromaDB Cloud and update the URL in `.env`.

## Quick Start Command

```bash
# Start ChromaDB
docker-compose up -d

# Wait a few seconds for it to start, then run ingestion
npm run ingest
```

## Verify ChromaDB is Running

You can test if ChromaDB is accessible:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

If it returns `{"nanosecond heartbeat": ...}`, ChromaDB is running correctly.

## Troubleshooting

- **Port 8000 already in use**: Change the port in `docker-compose.yml` and update `.env`
- **Docker not installed**: Install Docker Desktop from docker.com
- **Container won't start**: Check Docker logs with `docker-compose logs`



