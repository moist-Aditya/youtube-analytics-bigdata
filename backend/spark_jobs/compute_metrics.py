from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum, avg, desc, to_date

spark = SparkSession.builder.appName("youtube_metrics").getOrCreate()

INPUT_PARQUET = "/data/processed/youtube_parquet"
OUTPUT_DIR = "/data/processed/analytics"

df = spark.read.parquet(INPUT_PARQUET)

# ===========================================
# 1️⃣ TOP CHANNELS
# ===========================================
if 'channel_title' in df.columns and 'views' in df.columns:
    top_channels = (
        df.groupBy('channel_title')
          .agg(
              _sum('views').alias('total_views'),
              _sum('likes').alias('total_likes')
          )
          .orderBy(desc('total_views'))
          .limit(50)
    )

    top_channels.write.mode('overwrite').parquet(f"{OUTPUT_DIR}/top_channels")


# ===========================================
# 2️⃣ DAILY VIEWS **PER CHANNEL**
# ===========================================
if 'publish_time_ts' in df.columns and 'channel_title' in df.columns:
    df_dates = df.withColumn('date', to_date(col('publish_time_ts')))

    # FIXED: group by channel + date instead of date only
    daily = (
        df_dates.groupBy('channel_title', 'date')
                .agg(
                    _sum('views').alias('daily_views'),
                    _sum('likes').alias('daily_likes')
                )
                .orderBy('channel_title', 'date')
    )

    daily.write.mode('overwrite').parquet(f"{OUTPUT_DIR}/daily_views")


# ===========================================
# 3️⃣ CATEGORY ENGAGEMENT
# ===========================================
if 'category_id' in df.columns and 'engagement' in df.columns:
    cat_eng = (
        df.groupBy('category_id')
          .agg(
              avg('engagement').alias('avg_engagement'),
              _sum('views').alias('sum_views')
          )
          .orderBy(desc('avg_engagement'))
    )

    cat_eng.write.mode('overwrite').parquet(f"{OUTPUT_DIR}/category_engagement")


spark.stop()
