FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy full source first (needed for editable install)
COPY . .

# Install Python deps
RUN pip install --upgrade pip && pip install -e .

EXPOSE 8052

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8052"]
