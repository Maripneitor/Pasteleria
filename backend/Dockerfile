# backend/Dockerfile
FROM node:20

# Instalar dependencias necesarias para Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libcups2 \
    libcups2-dev \
    libxkbcommon0 \
    libxshmfence1 \
    libatk1.0-0 \
    libdrm2 \
    libxext6 \
    libxfixes3 \
    libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
