FROM python:3.10-slim
WORKDIR /app
COPY fastapi/requirements.txt ./
RUN pip install -r requirements.txt
COPY fastapi/ ./
ENV PROCESSED_DIR=/data/processed
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
