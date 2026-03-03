# Build Stage for Frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Final Stage for Backend & Serving
FROM node:20-slim
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy backend source
COPY server/ ./server/

# Copy built frontend assets from the build stage
COPY --from=frontend-build /app/client/dist ./client/dist

# Copy the CA certificate and .env (Note: .env should ideally be set via Secrets in HF)
COPY server/isrgrootx1.pem ./server/isrgrootx1.pem

# Expose the default Hugging Face port
EXPOSE 7860

# Set Hugging Face specific environment variable for port
ENV PORT=7860

# Start the application
WORKDIR /app/server
CMD ["node", "index.js"]
