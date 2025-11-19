from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
import pandas as pd
import os

app = FastAPI()
BASE = os.environ.get('PROCESSED_DIR', '/data/processed')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_parquet(path):
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        raise HTTPException(status_code=404, detail=f"Not found: {full}")
    return pd.read_parquet(full)

@app.get('/top-channels')
def top_channels(limit: int = 20):
    df = read_parquet('analytics/top_channels')
    return df.sort_values('total_views', ascending=False).head(limit).to_dict(orient='records')

@app.get('/daily-views')
def daily_views():
    df = read_parquet('analytics/daily_views')
    df['date'] = df['date'].astype(str)
    return df.to_dict(orient='records')

@app.get('/category-engagement')
def cat_engagement():
    df = read_parquet('analytics/category_engagement')
    return df.to_dict(orient='records')
