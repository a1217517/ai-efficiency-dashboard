.PHONY: build run dev test tidy clean docker

APP_NAME := ai-efficiency-admin
BUILD_DIR := ./bin
CMD_DIR := ./cmd/server

build:
	go build -ldflags="-s -w" -o $(BUILD_DIR)/$(APP_NAME) $(CMD_DIR)/main.go

dev:
	go run $(CMD_DIR)/main.go

run: build
	$(BUILD_DIR)/$(APP_NAME)

test:
	go test -v ./...

tidy:
	go mod tidy

fmt:
	go fmt ./...

vet:
	go vet ./...

clean:
	rm -rf $(BUILD_DIR)

docker:
	docker build -t $(APP_NAME):latest .
