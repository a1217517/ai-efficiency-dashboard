FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY server .

EXPOSE 8080

CMD ["./server"]
