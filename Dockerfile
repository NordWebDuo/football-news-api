FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy application files
COPY server.js ./
COPY README.md ./
COPY .gitignore ./

# Expose port and run
EXPOSE 8000
CMD ["node", "server.js"]