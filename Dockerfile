# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the NestJS
RUN npm run build

RUN ls -la /app/dist

# Expose API port
EXPOSE 3000

# Ensure Prisma Client is generated & migrations are applied before starting
CMD ["npm","run","start:prod"]