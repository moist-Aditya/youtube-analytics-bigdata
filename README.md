# YouTube Analytics Big Data Platform

A complete big data analytics platform using Hadoop HDFS, Apache Spark, FastAPI, and Next.js to process and visualize YouTube trending data.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ and pnpm
- 8GB+ RAM available for Docker

### Automated Setup (Recommended)

1. **Download the dataset** from [Trending Videos Dataset](https://www.kaggle.com/datasets/datasnaek/youtube-new?select=USvideos.csv)
2. **Move** the CSV to `data/raw/` folder and **rename** it to `youtube_trending.csv`
3. **Run** the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

The script will automatically:
- ✅ Build and start Hadoop (1 master + 2 workers) & Spark (1 master + 2 workers) clusters
- ✅ Upload data to HDFS
- ✅ Run Spark ETL and analytics jobs
- ✅ Start FastAPI backend and Next.js frontend

Once complete, access:
- **Dashboard:** http://localhost:3000
- **NameNode UI:** http://localhost:9870
- **Spark UI:** http://localhost:8081
- **FastAPI:** http://localhost:8000

### Manual Setup

See detailed instructions in [docker/hadoop/README.md](docker/hadoop/README.md)

## 🏗️ Architecture

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Next.js    │─────▶│    FastAPI      │─────▶│   Parquet    │
│  Dashboard   │      │   (Port 8000)   │      │    Files     │
└──────────────┘      └─────────────────┘      └──────────────┘
                                                        ▲
                                                        │
                            ┌───────────────────────────┘
                            │
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│  Raw CSV     │─────▶│  Spark Cluster  │─────▶│   HDFS       │
│              │      │  (ETL & Jobs)   │      │  Cluster     │
└──────────────┘      └─────────────────┘      └──────────────┘
                       Master + 2 Workers        Master + 2 Workers
```

**Components:**
- **Hadoop HDFS:** Distributed file system (1 NameNode + 2 DataNodes)
- **Spark:** Distributed processing engine (1 Master + 2 Workers)
- **FastAPI:** REST API serving analytics
- **Next.js:** Frontend dashboard with charts

## 📊 Features

- Real-time analytics dashboard
- Top channels by views
- Daily views trends
- Category engagement metrics
- Channel-specific forecasting (ML with Spark MLlib)
- Distributed data processing with Spark
- Fault-tolerant storage with HDFS replication

## 🛠️ Tech Stack

- **Data Storage:** Hadoop HDFS 3.3.6
- **Processing:** Apache Spark 3.5.0 (PySpark)
- **Backend:** FastAPI + Python 3.10
- **Frontend:** Next.js 16 + React 19 + Recharts
- **Containerization:** Docker + Docker Compose
- **Data Format:** Parquet (columnar storage)

## 📁 Project Structure

```
.
├── backend/
│   ├── fastapi/              # REST API
│   ├── spark_jobs/           # ETL & analytics jobs
│   └── processed-data/       # Output Parquet files
├── data/raw/                 # Input CSV
├── docker/hadoop/            # Hadoop cluster config
├── frontend/                 # Next.js dashboard
└── setup.sh                  # Automated setup
```

## 🔧 Useful Commands

```bash
# Check cluster status
docker compose -f docker/hadoop/docker-compose.yml ps

# View logs
docker logs hadoop-master
docker logs spark-master
docker logs fastapi

# Check HDFS
docker exec hadoop-master hdfs dfs -ls -R /

# Run Spark job manually
docker exec spark-master /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  /app/backend/spark_jobs/compute_metrics.py

# Stop all services
docker compose -f docker/hadoop/docker-compose.yml down

# Clean up (including volumes)
docker compose -f docker/hadoop/docker-compose.yml down -v
```