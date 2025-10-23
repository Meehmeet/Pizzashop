FROM node:20-slim AS build

WORKDIR /app

# Übergabe der API-Base-URL zur Build-Zeit (für Vite)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .

# Fix permissions for node_modules binaries
RUN chmod +x ./node_modules/.bin/*

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


