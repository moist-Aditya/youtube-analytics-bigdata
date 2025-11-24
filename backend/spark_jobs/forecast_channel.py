from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lag, lit
from pyspark.sql.window import Window
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
import datetime
import os
import sys

if len(sys.argv) < 2:
    print("Usage: spark-submit forecast_channel.py <channel_name>")
    sys.exit(1)

CHANNEL = sys.argv[1]

spark = SparkSession.builder.appName(f"Forecast_{CHANNEL}").getOrCreate()

DATA_DIR = "/data/processed/analytics/daily_views"  # where daily views parquet lives
FORECAST_DIR = f"/data/processed/forecasts/{CHANNEL}"

# Load all daily views
df = spark.read.parquet(DATA_DIR)

# Filter channel
df = df.filter(col("channel_title") == CHANNEL)

if df.count() < 3:
    print("Not enough data to train model.")
    spark.stop()
    sys.exit(0)

# Create lag feature
window = Window.orderBy("date")
df = df.withColumn("prev_day_views", lag("daily_views", 1).over(window))

# Remove first row (lag = null)
df = df.na.drop()

# Prepare ML features
assembler = VectorAssembler(
    inputCols=["prev_day_views"],
    outputCol="features"
)

final_df = assembler.transform(df).select("features", "daily_views")

# Train Linear Regression model
lr = LinearRegression(featuresCol="features", labelCol="daily_views")
model = lr.fit(final_df)

# Predict the next 7 days
last_row = df.orderBy(col("date").desc()).limit(1).collect()[0]
last_views = last_row["daily_views"]
# last_date = datetime.datetime.strptime(last_row["date"], "%Y-%m-%d")
last_date = last_row["date"]

# If Spark gives a datetime.date, convert to datetime.datetime
if isinstance(last_date, datetime.date) and not isinstance(last_date, datetime.datetime):
    last_date = datetime.datetime.combine(last_date, datetime.time())


predicted = []
current_views = last_views

for i in range(1, 8):
    next_day = last_date + datetime.timedelta(days=i)
    features = spark.createDataFrame([(float(current_views),)], ["prev_day_views"])
    features = assembler.transform(features)
    pred = model.transform(features).collect()[0]["prediction"]
    predicted.append((next_day.strftime("%Y-%m-%d"), max(pred, 0)))
    current_views = pred

# Convert to Spark DataFrame
pred_df = spark.createDataFrame(predicted, ["date", "predicted_views"])

# Save forecast results
pred_df.write.mode("overwrite").parquet(FORECAST_DIR)

print(f"Forecast saved to {FORECAST_DIR}")
spark.stop()
