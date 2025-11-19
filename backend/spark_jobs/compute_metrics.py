from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum, avg, desc, to_date

spark = SparkSession.builder.appName("youtube_metrics").getOrCreate()
INPUT_PARQUET = "/data/processed/youtube_parquet"
OUTPUT_DIR = "/data/processed/analytics"

df = spark.read.parquet(INPUT_PARQUET)

if 'channel_title' in df.columns and 'views' in df.columns:
    top_channels = df.groupBy('channel_title').agg(_sum('views').alias('total_views'), _sum('likes').alias('total_likes'))
    top_channels.orderBy(desc('total_views')).limit(50).write.mode('overwrite').parquet(f"{OUTPUT_DIR}/top_channels")

if 'publish_time_ts' in df.columns:
    df_dates = df.withColumn('date', to_date(col('publish_time_ts')))
    daily = df_dates.groupBy('date').agg(_sum('views').alias('daily_views'), _sum('likes').alias('daily_likes'))
    daily.orderBy('date').write.mode('overwrite').parquet(f"{OUTPUT_DIR}/daily_views")

if 'category_id' in df.columns and 'engagement' in df.columns:
    cat_eng = df.groupBy('category_id').agg(avg('engagement').alias('avg_engagement'), _sum('views').alias('sum_views'))
    cat_eng.orderBy(desc('avg_engagement')).write.mode('overwrite').parquet(f"{OUTPUT_DIR}/category_engagement")

spark.stop()
