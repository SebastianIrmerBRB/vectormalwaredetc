# Build Stage
FROM docker.io/library/python:3.12-slim-bullseye as builder
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Build-Tools nur im Builder installieren
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip setuptools wheel

WORKDIR /app
COPY pyproject.toml /app
COPY . /app
RUN pip install . --prefix=/install

# Runtime Stage
FROM docker.io/library/python:3.12-slim-bullseye
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN pip install --upgrade pip setuptools

# Nur die installierten Pakete kopieren
COPY --from=builder /install /usr/local
COPY . /app
WORKDIR /app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]