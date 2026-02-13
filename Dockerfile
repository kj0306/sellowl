FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Render sets PORT; default to 5000 for local Docker
ENV PORT=5000
EXPOSE ${PORT}

# Run with gunicorn (Render expects 0.0.0.0)
CMD gunicorn --bind 0.0.0.0:${PORT} --workers 1 app:app
