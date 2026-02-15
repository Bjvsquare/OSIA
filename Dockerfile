FROM node:20-alpine

WORKDIR /app

# Copy root package files and install frontend dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files and build frontend
COPY . .
RUN npm run build

# Install server dependencies and build server
WORKDIR /app/server
RUN npm install
RUN npm run build

# Back to app root
WORKDIR /app

# Create the data directory (volume mount point)
RUN mkdir -p /app/server/data

# Set production environment
ENV NODE_ENV=production

EXPOSE 3001

# Start using shell form so NODE_ENV and error output work
CMD node server/dist/server.js
