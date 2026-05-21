FROM rust:latest as builder   
WORKDIR /app

# Копируем манифесты для кеширования зависимостей
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# Копируем настоящий исходный код и пересобираем
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ---- Этап 2: финальный образ ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/image-hub /app/image-hub

EXPOSE 3001

CMD ["/app/image-hub"]