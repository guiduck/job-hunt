FROM python:3.12-slim

WORKDIR /app/apps/worker

COPY . ./

RUN pip install --no-cache-dir ".[test]"
