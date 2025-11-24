from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from urllib.parse import unquote
import pandas as pd
import os

app = FastAPI()

# Base processed directory (analytics + forecasts)
BASE = os.environ.get('PROCESSED_DIR', '/data/processed')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_parquet(relative_path: str):
    """Load a parquet directory relative to BASE."""
    full_path = os.path.join(BASE, relative_path)
    if not os.path.exists(full_path):
        raise HTTPException(404, f"Not found: {full_path}")

    return pd.read_parquet(full_path)


# ================================================================
# TOP CHANNELS
# ================================================================
@app.get('/top-channels')
def top_channels(limit: int = 20):
    df = read_parquet('analytics/top_channels')
    df = df.sort_values('total_views', ascending=False).head(limit)
    return df.to_dict(orient='records')


# ================================================================
# DAILY VIEWS (all channels)
# ================================================================
@app.get('/daily-views')
def daily_views():
    df = read_parquet('analytics/daily_views')
    df['date'] = df['date'].astype(str)
    return df.to_dict(orient='records')


# ================================================================
# CATEGORY ENGAGEMENT
# ================================================================
@app.get('/category-engagement')
def category_engagement():
    df = read_parquet('analytics/category_engagement')
    return df.to_dict(orient='records')


# ================================================================
# FORECAST (per channel)
# ================================================================
import subprocess
from urllib.parse import unquote

@app.get("/forecast/{channel}")
def get_forecast(channel: str):
    decoded = unquote(channel).strip()
    forecast_dir = os.path.join(BASE, "forecasts", decoded)

    # 1. If forecast already exists → return it
    if os.path.exists(forecast_dir):
        df = pd.read_parquet(forecast_dir)
        return df.to_dict(orient="records")

    # 2. Quote the channel name for spark-submit
    cmd = (
        f"/opt/spark/bin/spark-submit /app/backend/spark_jobs/forecast_channel.py \"{decoded}\""
    )

    # 3. Run Spark inside spark-master container
    result = subprocess.run(
        ["docker", "exec", "spark-master", "sh", "-c", cmd],
        capture_output=True,
        text=True
    )

    print("SPARK OUTPUT:\n", result.stdout)
    print("SPARK ERRORS:\n", result.stderr)

    if result.returncode != 0:
        raise HTTPException(500, f"Sparking forecasting failed: {result.stderr}")

    # 4. Check again after spark generation
    if not os.path.exists(forecast_dir):
        raise HTTPException(500, "Forecast directory not created.")

    df = pd.read_parquet(forecast_dir)
    return df.to_dict(orient="records")




# ================================================================
# HISTORY (per channel)
# ================================================================
@app.get("/history/{channel}")
def get_history(channel: str):
    # Decode and normalize input
    decoded = unquote(channel).strip().lower()

    df = read_parquet('analytics/daily_views')

    # Normalize stored channel names
    df["ch_lower"] = df["channel_title"].str.strip().str.lower()

    # Exact match (normalized)
    matched = df[df["ch_lower"] == decoded]

    # Fuzzy fallback
    if matched.empty:
        fuzzy = df[df["ch_lower"].str.contains(decoded)]
        if fuzzy.empty:
            return []
        matched = fuzzy

    matched = matched.sort_values("date")
    matched["date"] = matched["date"].astype(str)

    return matched[["date", "daily_views", "daily_likes"]].to_dict(orient="records")

@app.get("/search-channels")
def search_channels(q: str):
    q = q.strip().lower()
    if not q:
        return []

    df = read_parquet("analytics/daily_views")

    if "channel_title" not in df.columns:
        raise HTTPException(500, "channel_title missing in daily_views parquet")

    df["ch_lower"] = df["channel_title"].str.lower()

    # Remove duplicates, then filter
    unique_df = df.drop_duplicates(subset=["channel_title"])

    matches = unique_df[unique_df["ch_lower"].str.contains(q)]

    return matches[["channel_title"]].head(20).to_dict(orient="records")

