FROM node:18-slim

# Instalăm Chromium și dependențe
RUN apt-get update && apt-get install -y \
  chromium \
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
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .

# Setăm calea către executabil
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 8000
CMD ["node", "server.js"]