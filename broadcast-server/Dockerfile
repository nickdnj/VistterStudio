# VistterStudio Broadcast Server Dockerfile
FROM node:18-alpine

# Install FFmpeg and other system dependencies including build tools
RUN apk add --no-cache \
    ffmpeg \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    g++ \
    make \
    python3 \
    pkgconfig

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create recordings directory
RUN mkdir -p recordings

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the broadcast server
CMD ["npm", "start"]
