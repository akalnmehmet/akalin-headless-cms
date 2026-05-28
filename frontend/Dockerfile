# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılık dosyalarını önce kopyala (Docker layer cache optimizasyonu)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Kaynak kodu kopyala
COPY . .

# Build-time env değişkeni (docker-compose'dan build arg olarak geçilir)
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# TypeScript derle + Vite bundle oluştur
RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Build çıktısını Nginx'in servis ettiği klasöre kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx konfigürasyonunu kopyala (SPA fallback + proxy + gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx'in 80 portunu dışarı aç
EXPOSE 80

# Nginx'i foreground'da çalıştır (container'ın canlı kalması için)
CMD ["nginx", "-g", "daemon off;"]
