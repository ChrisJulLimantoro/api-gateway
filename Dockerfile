# Stage 1 - Build Stage
FROM node:23-alpine AS builder

# Install build dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2 - Production Stage
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Copy only the build and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm install --production

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
