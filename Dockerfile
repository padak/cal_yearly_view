# Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV VITE_API_BASE_URL=https://calendar-app-476469670271.europe-west1.run.app/api/v1
ENV VITE_GOOGLE_CLIENT_ID=476469670271-u6dk2tuv4djueji7sq0ol2icumsmep31.apps.googleusercontent.com
RUN npm run build

# Build backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /app/static

# Set environment variables
ENV STATIC_FILES_DIR=/app/static

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"] 