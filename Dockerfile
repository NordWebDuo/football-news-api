FROM node:18-slim

# Instalăm Chromium și dependențele lui
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgtk-3-0 \
    libgbm1 \
    libpango-1.0-0 \
    libcups2 \
    libxss1 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiem doar package.json și instalăm dependențele
COPY package.json package-lock.json ./
RUN npm install --production

# Copiem restul codului
COPY . .

# Pachetul puppeteer-core nu descarcă automat Chromium,
# deci îi spunem unde să-l găsească.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 8000
CMD ["node", "server.js"]