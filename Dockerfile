FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/dist ./pb_public
COPY --from=builder /app/pb_public ./

# Download PocketBase
RUN apk add --no-cache unzip curl && \
    curl -sL https://github.com/pocketbase/pocketbase/releases/download/v0.22.21/pocketbase_0.22.21_linux_amd64.zip -o pb.zip && \
    unzip pb.zip pocketbase && \
    rm pb.zip && \
    chmod +x pocketbase && \
    apk del unzip curl

EXPOSE 8090
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=./pb_data", "--origins=*"]
