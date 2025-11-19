from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_timestamp, expr

spark = SparkSession.builder.appName("youtube_etl").getOrCreate()

INPUT_CSV = "/data/raw/youtube_trending.csv"
OUTPUT_PARQUET = "/data/processed/youtube_parquet"

df = spark.read.option("header", True).option("multiline", True).csv(INPUT_CSV)

df2 = df
if 'views' in df2.columns:
    df2 = df2.withColumn('views', col('views').cast('long'))
if 'likes' in df2.columns:
    df2 = df2.withColumn('likes', col('likes').cast('long'))
if 'comment_count' in df2.columns:
    df2 = df2.withColumn('comments', col('comment_count').cast('long'))

if 'publish_time' in df2.columns:
    df2 = df2.withColumn('publish_time_ts', to_timestamp(col('publish_time')))

if set(['likes','comments','views']).issubset(set(df2.columns)):
    df2 = df2.withColumn('engagement', expr('(likes + comments) / NULLIF(views,0)'))

if 'country' in df2.columns:
    df2.write.mode('overwrite').partitionBy('country').parquet(OUTPUT_PARQUET)
else:
    df2.write.mode('overwrite').parquet(OUTPUT_PARQUET)

spark.stop()
