FROM python:3.11-slim

# Create user with UID 1000 for Hugging Face Spaces compatibility
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Pre-install CPU-only PyTorch for fast, lightweight image build
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install application dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, data, trained model artifacts, and compiled React frontend
COPY backend /app/backend
COPY data /app/data
COPY artifacts /app/artifacts
COPY frontend/dist /app/frontend/dist
COPY fraud_detection.db /app/fraud_detection.db

# Ensure permissions for non-root user
RUN chown -R user:user /app && chmod -R 777 /app

USER user

# Hugging Face Spaces default port
EXPOSE 7860

CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
