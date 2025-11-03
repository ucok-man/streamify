# Include env variables
include .env

# ------------------------------------------------------------------ #
#                               HELPERS                              #
# ------------------------------------------------------------------ #

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^//'

.PHONY: confirm
confirm:
	@echo 'Are you sure? [y/N]' && read ans && [ $${ans:-N} = y ]

# ------------------------------------------------------------------ #
#                          Install Script                            #
# ------------------------------------------------------------------ #
## dev/web: install the dependency
.PHONY: install
install:
	@go mod download && go mod tidy
	@cd cmd/web && bun install



# ------------------------------------------------------------------ #
#                             DEV SCRIPT                             #
# ------------------------------------------------------------------ #
## dev/web: run the cmd/web application dev mode
.PHONY: dev/web
dev/web:
	@cd cmd/web && bun run dev

## dev/api: run the cmd/api application dev mode
.PHONY: dev/api
dev/api:
	@air -c .air.toml

## dev: Run both web and api in development mode
##:	- note you need to install concurrently globaly 
##:	- npm install -g concurrently
.PHONY: dev
dev:
	@concurrently "make dev/web" "make dev/api"

# ------------------------------------------------------------------ #
#                             PROD SCRIPT                            #
# ------------------------------------------------------------------ #
## build/web: build the cmd/web application
.PHONY: build/web
build/web:
	@cd cmd/web && bun run build

## build/api: build the cmd/api application
.PHONY: build/api
build/api:
	@go build -o ./build/server ./cmd/api/*.go

## build: build the web and server
.PHONY: build
build:
	@make build/web
	@make build/api

## serve: serve production mode from build artifact
.PHONY: serve
serve:
	@API_ENV=production ./build/server


# ------------------------------------------------------------------ #
#                                 CLI                                #
# ------------------------------------------------------------------ #
## cli: run the cmd/cli application $(ARGS) 
##:	- ex `make cli ARGS="db seed"`
.PHONY: cli
cli:
	@go run ./cmd/cli/*.go $(ARGS)