# Stage 1: Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python backend + serve frontend
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from stage 1
COPY --from=frontend /app/dist ./dist

# Render sets PORT; default to 5000 for local Docker
ENV PORT=5000
EXPOSE ${PORT}

# Run with gunicorn (Render expects 0.0.0.0)
CMD gunicorn --bind 0.0.0.0:${PORT} --workers 1 app:app
