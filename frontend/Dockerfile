FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retries 5 && npm ci --verbose

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
