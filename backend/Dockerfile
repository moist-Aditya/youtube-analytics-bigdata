FROM python:3.10-slim

RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean

WORKDIR /app

COPY fastapi/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY fastapi/ ./

ENV PROCESSED_DIR=/data/processed

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
