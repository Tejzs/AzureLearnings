FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p /app/data
CMD ["node", "index.js"]
