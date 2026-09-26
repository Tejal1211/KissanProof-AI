FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY backend/ ./
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/tmp/kisanproof-data
ENV STATIC_DIR=/app/backend/public
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public
EXPOSE 8080
CMD ["node", "dist/src/index.js"]