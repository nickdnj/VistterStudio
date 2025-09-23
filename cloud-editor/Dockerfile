FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies (including dev dependencies for development)
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend
RUN cd frontend && npm run build

# Create segments directory
RUN mkdir -p /app/data/segments

# Expose ports
EXPOSE 3000 4000

# Start both frontend and backend
CMD ["sh", "-c", "cd frontend && npx vite --host 0.0.0.0 --port 3000 & cd backend && npx nodemon server.js & wait"]
