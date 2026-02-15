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

# Set production environment
ENV NODE_ENV=production

# Railway injects PORT automatically
EXPOSE ${PORT:-3001}

# Start the server
CMD ["node", "server/dist/server.js"]
