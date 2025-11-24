Hadoop + Spark cluster (Docker)

This folder provides a simple Docker-based Hadoop cluster (1 master + 2 workers) and Spark master + 2 Spark workers which can read/write from HDFS. It uses an Ubuntu-based Hadoop image built from `docker/hadoop/Dockerfile` and the stock `apache/spark` image for Spark containers. FastAPI is reused from `./backend` and is configured to see the Hadoop configuration.

## Cluster Status

**Successfully running:**
- Hadoop Master: `http://localhost:9870` (NameNode UI), `http://localhost:8088` (YARN RM)
- HDFS available at: `hdfs://hadoop-master:9000`
- Spark Master UI: `http://localhost:8081`
- FastAPI: `http://localhost:8000`
- 2 Hadoop workers + 2 Spark workers

**Next steps:**

1. **Upload data to HDFS:**
```bash
# Copy file into hadoop-master container
docker cp ./data/raw/youtube_trending.csv hadoop-master:/tmp/youtube_trending.csv

# Put file into HDFS
docker exec hadoop-master hdfs dfs -mkdir -p /data/raw
docker exec hadoop-master hdfs dfs -put -f /tmp/youtube_trending.csv /data/raw/

# Verify
docker exec hadoop-master hdfs dfs -ls /data/raw
```

2. **Update Spark jobs to use HDFS paths:**
Edit `backend/spark_jobs/*.py` to read from `hdfs://hadoop-master:9000/data/raw/...` instead of local paths.

3. **Run ETL and metrics:**
```bash
# ETL
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/etl_youtube.py

# Analytics
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/compute_metrics.py
```

4. **Start frontend:**
```bash
cd frontend/youtube-analytics-dashboard
npm install
npm run dev
# Visit http://localhost:3000
```

---

## Architecture

Files created
- `docker/hadoop/Dockerfile` — Ubuntu-based image with Hadoop installed.
- `docker/hadoop/hadoop_conf/` — Hadoop XML configs (core-site.xml, hdfs-site.xml, yarn-site.xml, mapred-site.xml, workers).
- `docker/hadoop/docker-compose.yml` — Compose file to launch the full stack (HDFS, Spark, FastAPI).

How it works (high-level)
- `hadoop-master` runs NameNode, ResourceManager and manages HDFS metadata on volume `hadoop_namenode`.
- `hadoop-worker-1` and `hadoop-worker-2` run DataNode and NodeManager services and store block data on `hadoop_datanode` volume.
- Spark master/workers run as standalone cluster but are configured with the Hadoop client config so they can access `hdfs://hadoop-master:9000` paths.
- FastAPI container mounts the processed-data folder and Hadoop config so it can read the Parquet files produced by Spark jobs.

Quick start

1. Build and start services (from repo root):

```bash
docker compose -f docker/hadoop/docker-compose.yml up --build
```

2. Wait until NameNode UI is available at `http://localhost:9870` and Spark UI at `http://localhost:8081`.

3. Upload data to HDFS

```bash
# Copy file into hadoop-master container, then put into HDFS
docker cp ./data/raw/youtube_trending.csv hadoop-master:/tmp/youtube_trending.csv
docker exec hadoop-master hdfs dfs -mkdir -p /data/raw
docker exec hadoop-master hdfs dfs -put -f /tmp/youtube_trending.csv /data/raw/youtube_trending.csv

# Verify file is in HDFS
docker exec hadoop-master hdfs dfs -ls /data/raw
```

4. Run ETL and compute metrics

```bash
# ETL: load CSV -> Parquet
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/etl_youtube.py

# Compute analytics
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/compute_metrics.py
```

5. Start frontend (locally) and visit dashboard

```bash
cd frontend/youtube-analytics-dashboard
npm install
npm run dev
# open http://localhost:3000
```

Notes & caveats
- This setup is for local development and demonstration. Production Hadoop/Spark clusters require careful tuning, security, and resource management.
- The Spark image must be able to locate Hadoop configuration (we mount `docker/hadoop/hadoop_conf` into `/opt/hadoop/etc/hadoop`). If Spark jobs fail due to missing Hadoop jars, you may need to include Hadoop client jars in the Spark image or run Spark on YARN by configuring Spark with YARN support.
- FastAPI triggers spark jobs by running `docker exec spark-master ...` in the original repo. With this compose setup you can still run Spark jobs from FastAPI if the container has Docker CLI available (the provided `backend/Dockerfile` installs `docker.io`).

Next steps I can do for you
- Add a small FastAPI endpoint to upload files directly to HDFS and kick off ETL jobs.
- Replace Spark standalone with Spark-on-YARN (so Spark runs as YARN applications) and have Spark use YARN ResourceManager.
- Add health/job-status endpoints that query YARN or Spark UIs and expose metrics to the frontend dashboard.

If you want, I can implement a FastAPI endpoint for file uploads + job triggers next. Request which next step you prefer.