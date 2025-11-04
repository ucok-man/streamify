FROM oven/bun:alpine AS node-builder
WORKDIR /app
COPY . .
WORKDIR /app/cmd/web
RUN bun install
ARG VITE_GETSTREAMIO_API_KEY
ENV VITE_GETSTREAMIO_API_KEY=$VITE_GETSTREAMIO_API_KEY
# This will placed on build folder. Look on vite config.
RUN bun run build 

FROM golang:1.25-alpine AS go-builder
WORKDIR /app
COPY . .
RUN go mod download && go mod tidy
RUN go build -o ./build/server ./cmd/api/*.go

FROM golang:1.25-alpine as dockploy
WORKDIR /app
COPY --from=node-builder /app/build/ui /app/
COPY --from=go-builder /app/build/server /app/

EXPOSE 8000
CMD [ "./server" ]
