FROM python:3.12-slim

WORKDIR /app/apps/api

COPY . ./

RUN pip install --no-cache-dir ".[test]"
