# YouTube Analytics Big Data Platform

A complete big data analytics platform using Hadoop HDFS, Apache Spark, FastAPI, and Next.js to process and visualize YouTube trending data.

## 🏗️ Architecture

**Cluster Components:**
- **Hadoop HDFS Cluster:** 1 master + 2 workers (Ubuntu 22.04 + Hadoop 3.3.6)
  - NameNode (master): Metadata management, Web UI at port 9870
  - DataNode (workers): Distributed data storage with replication factor 2
  - YARN ResourceManager (master): Job scheduling, UI at port 8088
  - YARN NodeManager (workers): Container execution
  
- **Spark Standalone Cluster:** 1 master + 2 workers (Spark 3.5.0)
  - Spark Master: Job coordination, Web UI at port 8081
  - Spark Workers: Distributed computation

- **FastAPI Backend:** Python REST API (port 8000)
  - Serves processed analytics from Parquet files
  - Can trigger Spark jobs on-demand via Docker exec

- **Next.js Frontend:** React dashboard (port 3000)
  - Real-time charts using Recharts
  - Fetches data from FastAPI endpoints

**Data Flow:**
```
Raw CSV → HDFS → Spark ETL → Parquet (shared volume) → FastAPI → Frontend Dashboard
```

---

## 🚀 Quick Start (Automated)

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ and pnpm installed (for frontend)
- At least 8GB RAM available for Docker

### Option 1: Automated Setup Script

From the repository root, run:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
1. ✅ Build and start all Docker containers (Hadoop, Spark, FastAPI)
2. ✅ Wait for services to be healthy
3. ✅ Upload sample data to HDFS
4. ✅ Run Spark ETL and analytics jobs
5. ✅ Install frontend dependencies
6. ✅ Start the Next.js development server

Once complete, open:
- **Dashboard:** http://localhost:3000
- **NameNode UI:** http://localhost:9870
- **Spark UI:** http://localhost:8081
- **YARN UI:** http://localhost:8088
- **FastAPI Docs:** http://localhost:8000/docs

---

## 📋 Manual Setup (Step-by-Step)

### Step 1: Start Docker Services

```bash
# From repository root
docker compose -f docker/hadoop/docker-compose.yml up -d --build
```

Wait ~30 seconds for all services to start. Verify with:
```bash
docker compose -f docker/hadoop/docker-compose.yml ps
```

You should see 7 running containers:
- hadoop-master, hadoop-worker-1, hadoop-worker-2
- spark-master, spark-worker-1, spark-worker-2
- fastapi

### Step 2: Upload Data to HDFS

```bash
# Copy CSV into hadoop-master container
docker cp ./data/raw/youtube_trending.csv hadoop-master:/tmp/youtube_trending.csv

# Create HDFS directory and upload file
docker exec hadoop-master hdfs dfs -mkdir -p /data/raw
docker exec hadoop-master hdfs dfs -put -f /tmp/youtube_trending.csv /data/raw/youtube_trending.csv

# Verify upload
docker exec hadoop-master hdfs dfs -ls /data/raw
docker exec hadoop-master hdfs dfs -du -h /data/raw
```

### Step 3: Run Spark Jobs

**ETL Job** (CSV → Parquet):
```bash
docker exec -it spark-master /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  /app/backend/spark_jobs/etl_youtube.py
```

**Analytics Job** (Compute Metrics):
```bash
docker exec -it spark-master /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  /app/backend/spark_jobs/compute_metrics.py
```

**Forecast Job** (Optional - per channel):
```bash
docker exec -it spark-master /opt/spark/bin/spark-submit \
  /app/backend/spark_jobs/forecast_channel.py "Channel Name"
```

### Step 4: Start Frontend

```bash
cd frontend/youtube-analytics-dashboard
pnpm install
pnpm dev
```

Visit: **http://localhost:3000**

---

## 🔧 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend Dashboard | http://localhost:3000 | Next.js analytics UI |
| FastAPI Backend | http://localhost:8000 | REST API |
| FastAPI Docs | http://localhost:8000/docs | Swagger/OpenAPI |
| Hadoop NameNode | http://localhost:9870 | HDFS overview |
| YARN ResourceManager | http://localhost:8088 | Job tracker |
| Spark Master | http://localhost:8081 | Spark cluster status |

---

## 🛠️ Useful Commands

### Check Cluster Health

```bash
# Check all services
docker compose -f docker/hadoop/docker-compose.yml ps

# Check HDFS health
docker exec hadoop-master hdfs dfsadmin -report

# Check HDFS files
docker exec hadoop-master hdfs dfs -ls -R /

# Check Spark workers
docker logs spark-master | grep -i worker
```

### View Logs

```bash
# Hadoop NameNode
docker logs hadoop-master

# Spark jobs
docker logs spark-master

# FastAPI
docker logs fastapi

# Frontend (in terminal where pnpm dev runs)
```

### Restart Services

```bash
# Restart all
docker compose -f docker/hadoop/docker-compose.yml restart

# Restart specific service
docker compose -f docker/hadoop/docker-compose.yml restart hadoop-master

# Stop all
docker compose -f docker/hadoop/docker-compose.yml down

# Start all
docker compose -f docker/hadoop/docker-compose.yml up -d
```

### Clean Up

```bash
# Stop and remove containers (keeps volumes)
docker compose -f docker/hadoop/docker-compose.yml down

# Remove everything including volumes (DELETES DATA)
docker compose -f docker/hadoop/docker-compose.yml down -v

# Remove dangling images
docker image prune -f
```

---

## 📦 Project Structure

```
.
├── backend/
│   ├── fastapi/
│   │   ├── app.py              # REST API endpoints
│   │   └── requirements.txt
│   ├── spark_jobs/
│   │   ├── etl_youtube.py      # CSV → Parquet ETL
│   │   ├── compute_metrics.py  # Analytics aggregation
│   │   └── forecast_channel.py # ML forecasting
│   └── processed-data/         # Parquet output (shared volume)
│
├── data/
│   └── raw/
│       └── youtube_trending.csv # Input dataset
│
├── docker/
│   └── hadoop/
│       ├── Dockerfile          # Hadoop cluster image
│       ├── docker-compose.yml  # Full stack orchestration
│       ├── docker-entrypoint.sh
│       └── hadoop_conf/        # HDFS & YARN configs
│
├── frontend/
│   └── youtube-analytics-dashboard/
│       ├── app/
│       │   ├── page.tsx        # Main dashboard
│       │   └── channel/[channel]/page.tsx  # Forecast page
│       └── package.json
│
└── setup.sh                    # Automated setup script
```

---

## 🐛 Troubleshooting

### Hadoop containers keep restarting

Check logs:
```bash
docker logs hadoop-master 2>&1 | tail -30
```

Common issues:
- **JAVA_HOME error:** Verify `JAVA_HOME=/usr/lib/jvm/java-11-openjdk-arm64` (or amd64 for x86)
- **Permission errors:** Ensure entrypoint script is executable
- **Port conflicts:** Check if ports 9870, 9000, 8088 are available

### Spark jobs fail with HDFS errors

Verify HDFS paths in Spark jobs:
```python
# Should use HDFS URLs
INPUT_CSV = "hdfs://hadoop-master:9000/data/raw/youtube_trending.csv"
OUTPUT_PARQUET = "hdfs://hadoop-master:9000/data/processed/youtube_parquet"
```

Or keep using local paths with shared volumes (current setup).

### Frontend shows empty charts

1. Check if FastAPI is running: http://localhost:8000/top-channels
2. Verify Parquet files exist:
```bash
docker exec fastapi ls -la /data/processed/analytics/
```
3. Check browser console for CORS errors

### "Connection refused" errors

Ensure all services are up:
```bash
docker compose -f docker/hadoop/docker-compose.yml ps
```

Restart if needed:
```bash
docker compose -f docker/hadoop/docker-compose.yml restart
```

---

## 📝 Configuration Details

### Hadoop Configuration

**core-site.xml:**
- `fs.defaultFS`: `hdfs://hadoop-master:9000`

**hdfs-site.xml:**
- `dfs.replication`: `2` (data replicated to 2 DataNodes)
- `dfs.namenode.name.dir`: `/hadoop_data/hdfs/namenode`
- `dfs.datanode.data.dir`: `/hadoop_data/hdfs/datanode`

**yarn-site.xml:**
- `yarn.resourcemanager.hostname`: `hadoop-master`

### Volumes

- `hadoop_namenode`: NameNode metadata (persistent)
- `hadoop_datanode`: DataNode blocks (persistent)
- `./backend/processed-data`: Shared Parquet files (host-mounted)
- `./data/raw`: Input CSV files (host-mounted)