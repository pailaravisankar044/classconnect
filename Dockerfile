# ========================================================
# ClassConnect - Multi-Stage Production Dockerfile
# Node.js 22 Alpine (with native node:sqlite support)
# ========================================================

# --- Stage 1: Build Frontend Client ---
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# --- Stage 2: Build Backend Server ---
FROM node:22-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/classconnect.db
ENV UPLOAD_DIR=/app/uploads/materials

# Copy server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy compiled backend output & schema
COPY --from=server-builder /app/server/dist ./server/dist
COPY server/src/db/schema.sql ./server/dist/db/schema.sql
COPY server/src/db/schema.sql ./server/src/db/schema.sql

# Copy compiled frontend SPA
COPY --from=client-builder /app/client/dist ./client/dist

# Copy distribution APK
COPY uploads/apk ./uploads/apk

# Ensure data and upload directories exist
RUN mkdir -p /app/data /app/uploads/materials /app/uploads/apk

# Expose production port (Render/Railway dynamically injects PORT)
EXPOSE 5000

# Persistent data volumes
VOLUME ["/app/data", "/app/uploads"]

# Launch unified server
CMD ["node", "server/dist/server.js"]
