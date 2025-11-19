#!/bin/bash

echo "==========================================="
echo "      YouTube Big Data Analytics Demo       "
echo "==========================================="

# Step 1: Start Docker stack
echo ""
echo "▶ Starting Docker (Spark + FastAPI)..."
docker compose up -d

echo "✓ Docker services started"
echo ""

# Wait for Spark master to be ready
echo "⏳ Waiting for Spark Master to start..."
sleep 5

# Step 2: Run ETL
echo ""
echo "▶ Running Spark ETL job..."
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/etl_youtube.py

echo "✓ ETL completed"
echo ""

# Step 3: Run Metrics Aggregation
echo "▶ Running Spark Metrics job..."
docker exec -it spark-master /opt/spark/bin/spark-submit /app/backend/spark_jobs/compute_metrics.py

echo "✓ Metrics generated"
echo ""

# Step 4: Start Frontend
echo "▶ Starting Next.js frontend..."
cd frontend/youtube-analytics-dashboard
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Frontend running on http://localhost:3000"
echo ""

# Step 5: Optional — Auto open browser (Linux)
if command -v zen > /dev/null; then
    zen http://localhost:3000 &
elif command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
else
    echo "⚠️ Could not detect a browser"
fi

echo ""
echo "==========================================="
echo "   DEMO READY!   "
echo "==========================================="

# Keep logs visible
wait $FRONTEND_PID
