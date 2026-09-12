# Every team fills in the commands for their own stack.
# The CI pipeline calls these targets, so the names must not change.
#
# Examples:
#   Node    install: npm ci          test: npm test        build: npm run build
#   Python  install: pip install -r requirements.txt
#                                    test: pytest          build: echo "no build step"
#   Java    install: ./mvnw -B dependency:go-offline
#                                    test: ./mvnw test     build: ./mvnw package

.PHONY: install test build run docker-build docker-up

install:
	@echo "No external dependencies required"

test:
	@echo "Running tests..."
	@node tests/test.js

build:
	@echo "Static website - no build step required"

run:
	@echo "Open index.html in a browser"

# Needed from M4 onwards
docker-build:
	@echo "TODO: docker build for frontend and backend" && exit 1

docker-up:
	docker compose up --build
