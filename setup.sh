#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed ($(docker --version))"
    else
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    # Check Docker Compose
    if docker compose version &> /dev/null; then
        print_success "Docker Compose is installed"
    else
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
    
    # Check pnpm or npm
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
        print_success "pnpm is installed ($(pnpm --version))"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        print_success "npm is installed ($(npm --version))"
        print_info "Using npm as package manager (pnpm preferred but not required)"
    else
        print_error "Neither pnpm nor npm is installed. Please install Node.js."
        exit 1
    fi
    
    # Check if data file exists
    if [ -f "./data/raw/youtube_trending.csv" ]; then
        print_success "Dataset found at ./data/raw/youtube_trending.csv"
    else
        print_error "Dataset not found at ./data/raw/youtube_trending.csv"
        print_info "Please add your dataset or download sample data."
        exit 1
    fi
}

# Stop existing services
stop_existing() {
    print_header "Stopping Existing Services"
    
    # Stop docker compose services
    if docker compose -f docker/hadoop/docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
        print_info "Stopping existing Docker services..."
        docker compose -f docker/hadoop/docker-compose.yml down
        print_success "Stopped existing services"
    else
        print_info "No existing services to stop"
    fi
    
    # Kill any frontend dev server
    if lsof -ti:3000 &> /dev/null; then
        print_info "Stopping frontend on port 3000..."
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
        print_success "Stopped frontend"
    fi
}

# Build and start Docker services
start_cluster() {
    print_header "Starting Hadoop & Spark Cluster"
    
    print_info "Building and starting services (this may take a few minutes)..."
    docker compose -f docker/hadoop/docker-compose.yml up -d --build
    
    print_success "Docker services started"
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if all services are running
    RUNNING=$(docker compose -f docker/hadoop/docker-compose.yml ps --status running | wc -l)
    if [ "$RUNNING" -ge 7 ]; then
        print_success "All services are running"
    else
        print_error "Some services failed to start. Check logs with:"
        echo "  docker compose -f docker/hadoop/docker-compose.yml logs"
        exit 1
    fi
}

# Upload data to HDFS
upload_to_hdfs() {
    print_header "Uploading Data to HDFS"
    
    # Wait for hadoop-master to be ready
    print_info "Waiting for Hadoop NameNode to be ready..."
    RETRIES=0
    MAX_RETRIES=30
    while [ $RETRIES -lt $MAX_RETRIES ]; do
        if docker exec hadoop-master hdfs dfs -ls / &> /dev/null; then
            break
        fi
        sleep 2
        RETRIES=$((RETRIES+1))
    done
    
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        print_error "Hadoop NameNode did not start in time"
        print_info "Check logs: docker logs hadoop-master"
        exit 1
    fi
    
    print_success "Hadoop NameNode is ready"
    
    # Copy file into container
    print_info "Copying dataset into hadoop-master container..."
    docker cp ./data/raw/youtube_trending.csv hadoop-master:/tmp/youtube_trending.csv
    print_success "File copied"
    
    # Create HDFS directory and upload
    print_info "Creating HDFS directory..."
    docker exec hadoop-master hdfs dfs -mkdir -p /data/raw
    
    print_info "Uploading to HDFS..."
    docker exec hadoop-master hdfs dfs -put -f /tmp/youtube_trending.csv /data/raw/youtube_trending.csv
    
    # Verify
    FILE_SIZE=$(docker exec hadoop-master hdfs dfs -du -h /data/raw/youtube_trending.csv | awk '{print $1 " " $2}')
    print_success "Uploaded to HDFS (Size: $FILE_SIZE)"
    
    # Show HDFS content
    print_info "HDFS directory listing:"
    docker exec hadoop-master hdfs dfs -ls /data/raw
    
    # Fix HDFS permissions for Spark user
    print_info "Setting HDFS permissions..."
    docker exec hadoop-master hdfs dfs -chmod -R 777 /data
    print_success "HDFS permissions set"
}

# Run Spark ETL job
run_etl() {
    print_header "Running Spark ETL Job"
    
    print_info "Transforming CSV to Parquet format..."
    docker exec spark-master /opt/spark/bin/spark-submit \
        --master spark://spark-master:7077 \
        /app/backend/spark_jobs/etl_youtube.py
    
    print_success "ETL job completed"
    
    # Verify output
    if docker exec fastapi ls /data/processed/youtube_parquet &> /dev/null; then
        print_success "Parquet files created"
    else
        print_error "ETL job failed - no output files found"
        exit 1
    fi
}

# Run Spark analytics job
run_analytics() {
    print_header "Running Spark Analytics Job"
    
    print_info "Computing metrics (top channels, daily views, category engagement)..."
    docker exec spark-master /opt/spark/bin/spark-submit \
        --master spark://spark-master:7077 \
        /app/backend/spark_jobs/compute_metrics.py
    
    print_success "Analytics job completed"
    
    # Verify outputs
    ANALYTICS_DIR="/data/processed/analytics"
    if docker exec fastapi ls $ANALYTICS_DIR/top_channels &> /dev/null && \
       docker exec fastapi ls $ANALYTICS_DIR/daily_views &> /dev/null && \
       docker exec fastapi ls $ANALYTICS_DIR/category_engagement &> /dev/null; then
        print_success "All analytics outputs generated"
    else
        print_error "Analytics job incomplete - some outputs missing"
    fi
}

# Test FastAPI
test_api() {
    print_header "Testing FastAPI Endpoints"
    
    print_info "Waiting for FastAPI to be ready..."
    sleep 3
    
    # Test top-channels endpoint
    if curl -s http://localhost:8000/top-channels?limit=5 | grep -q "channel_title"; then
        print_success "FastAPI is responding correctly"
    else
        print_error "FastAPI test failed"
        print_info "Check logs: docker logs fastapi"
    fi
}

# Install and start frontend
start_frontend() {
    print_header "Setting Up Frontend"
    
    cd frontend/youtube-analytics-dashboard
    
    print_info "Installing frontend dependencies with $PKG_MANAGER..."
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm install --silent
    else
        npm install --silent
    fi
    print_success "Dependencies installed"
    
    print_info "Starting Next.js development server..."
    print_info "Frontend will be available at: http://localhost:3000"
    print_info ""
    print_info "Press Ctrl+C to stop the frontend server"
    print_info ""
    
    # Start dev server (this will block)
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm run dev
    else
        npm run dev
    fi
}

# Main setup flow
main() {
    clear
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  YouTube Analytics Big Data Platform - Automated Setup   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    stop_existing
    start_cluster
    upload_to_hdfs
    run_etl
    run_analytics
    test_api
    
    print_header "Setup Complete! 🎉"
    
    echo -e "${GREEN}Services are running:${NC}"
    echo "  • Frontend Dashboard: http://localhost:3000"
    echo "  • FastAPI Backend:    http://localhost:8000"
    echo "  • FastAPI Docs:       http://localhost:8000/docs"
    echo "  • Hadoop NameNode:    http://localhost:9870"
    echo "  • YARN RM:            http://localhost:8088"
    echo "  • Spark Master:       http://localhost:8081"
    echo ""
    
    echo -e "${YELLOW}Starting frontend...${NC}"
    echo ""
    
    # Start frontend (will block here)
    start_frontend
}

# Run main
main
