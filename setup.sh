#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "\n${GREEN}▶ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# Check prerequisites
command -v docker &> /dev/null || print_error "Docker not installed"
docker info &> /dev/null || print_error "Docker daemon not running"
[ -f "./data/raw/youtube_trending.csv" ] || print_error "Dataset not found at ./data/raw/youtube_trending.csv"

if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    print_error "npm or pnpm not installed"
fi

# Stop existing services
print_step "Stopping existing services"
docker compose -f docker/hadoop/docker-compose.yml down 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start cluster
print_step "Starting Hadoop & Spark cluster"
docker compose -f docker/hadoop/docker-compose.yml up -d --build
sleep 10

# Upload to HDFS
print_step "Uploading data to HDFS"
RETRIES=0
while [ $RETRIES -lt 30 ]; do
    docker exec hadoop-master hdfs dfs -ls / &> /dev/null && break
    sleep 2
    RETRIES=$((RETRIES+1))
done
[ $RETRIES -eq 30 ] && print_error "Hadoop NameNode timeout"

# Wait for safe mode
RETRIES=0
while [ $RETRIES -lt 30 ]; do
    docker exec hadoop-master hdfs dfsadmin -safemode get 2>/dev/null | grep -q "OFF" && break
    sleep 2
    RETRIES=$((RETRIES+1))
done
[ $RETRIES -eq 30 ] && docker exec hadoop-master hdfs dfsadmin -safemode leave

docker cp ./data/raw/youtube_trending.csv hadoop-master:/tmp/youtube_trending.csv
docker exec hadoop-master hdfs dfs -mkdir -p /data/raw
docker exec hadoop-master hdfs dfs -put -f /tmp/youtube_trending.csv /data/raw/youtube_trending.csv
docker exec hadoop-master hdfs dfs -chmod -R 777 /data

# Run Spark jobs
print_step "Running Spark ETL job"
docker exec spark-master /opt/spark/bin/spark-submit --master spark://spark-master:7077 /app/backend/spark_jobs/etl_youtube.py

print_step "Running Spark analytics job"
docker exec spark-master /opt/spark/bin/spark-submit --master spark://spark-master:7077 /app/backend/spark_jobs/compute_metrics.py

# Test API
print_step "Testing FastAPI"
sleep 3
curl -s http://localhost:8000/top-channels?limit=5 | grep -q "channel_title" || print_error "FastAPI test failed"

# Setup complete
echo -e "\n${GREEN}✓ Setup complete!${NC}\n"
echo "Services:"
echo "  • Dashboard:  http://localhost:3000"
echo "  • API:        http://localhost:8000/docs"
echo "  • Hadoop UI:  http://localhost:9870"
echo "  • Spark UI:   http://localhost:8081"
echo ""

# Start frontend
print_step "Starting frontend"
cd frontend/youtube-analytics-dashboard
$PKG_MANAGER install --silent
$PKG_MANAGER run dev
