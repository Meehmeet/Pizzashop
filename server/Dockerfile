FROM node:21-slim

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Clean install
RUN npm install --omit=dev

# Copy only necessary server files
COPY server/index.js ./
COPY server/validation.js ./
COPY server/create-admin.js ./
COPY server/pizzashop.sql ./

EXPOSE 8081

CMD ["node", "index.js"]


