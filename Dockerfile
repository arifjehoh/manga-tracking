# Multi-stage build for Manga Tracker
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app/backend
RUN apk add --no-cache gcc musl-dev sqlite-dev

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/manga-tracker ./cmd/main.go

# Stage 3: Production image
FROM alpine:latest

RUN apk add --no-cache sqlite-libs ca-certificates

WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/manga-tracker /app/manga-tracker

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create data directory
RUN mkdir -p /data/images

# Set environment variables
ENV PORT=8080
ENV DATA_DIR=/data
ENV FRONTEND_DIR=/app/frontend/dist

EXPOSE 8080

# Volume for persistent data
VOLUME ["/data"]

CMD ["/app/manga-tracker"]
