FROM node:20-slim

WORKDIR /app

# Install dependencies (tolerant to lock mismatch / peer deps)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4000"]
