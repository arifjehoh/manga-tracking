.PHONY: run build test lint format clean db-reset help

# Binary name
BINARY_NAME=manga-tracker

# Directories
BIN_DIR=bin
DATA_DIR=../data

# Default port
PORT?=8080

## help: Show this help message
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

## run: Run the application in development mode
run:
	@echo "Starting server on port ${PORT}..."
	@PORT=${PORT} DATA_DIR=${DATA_DIR} go run ./cmd/main.go

## build: Build the application binary
build:
	@echo "Building ${BINARY_NAME}..."
	@mkdir -p ${BIN_DIR}
	@go build -o ${BIN_DIR}/${BINARY_NAME} ./cmd/main.go
	@echo "Build complete: ${BIN_DIR}/${BINARY_NAME}"

## test: Run all tests
test:
	@echo "Running tests..."
	@go test -v ./...

## test-coverage: Run tests with coverage report
test-coverage:
	@echo "Running tests with coverage..."
	@go test -cover ./...

## lint: Run linter (golangci-lint)
lint:
	@echo "Running linter..."
	@which golangci-lint > /dev/null || (echo "golangci-lint not installed. Install: https://golangci-lint.run/usage/install/" && exit 1)
	@golangci-lint run

## format: Auto-fix linting and formatting issues
format:
	@echo "Formatting code..."
	@which golangci-lint > /dev/null || (echo "golangci-lint not installed. Install: https://golangci-lint.run/usage/install/" && exit 1)
	@golangci-lint run --fix
	@go fmt ./...
	@echo "Format complete"

## clean: Remove built binaries and temporary files
clean:
	@echo "Cleaning..."
	@rm -rf ${BIN_DIR}
	@go clean
	@echo "Clean complete"

## db-reset: Backup current database and create a fresh one
db-reset:
	@echo "Resetting database..."
	@mkdir -p ${DATA_DIR}
	@if [ -f "${DATA_DIR}/manga.db" ]; then \
		TIMESTAMP=$$(date +%Y-%m-%d_%H-%M-%S); \
		mv ${DATA_DIR}/manga.db ${DATA_DIR}/manga.db.$$TIMESTAMP; \
		echo "Backed up database to manga.db.$$TIMESTAMP"; \
	fi
	@echo "Database reset complete. New DB will be created on next run."

## tidy: Tidy and verify Go modules
tidy:
	@echo "Tidying Go modules..."
	@go mod tidy
	@go mod verify
	@echo "Tidy complete"
