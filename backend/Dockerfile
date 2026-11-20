FROM node:22-alpine

WORKDIR /app

# najpierw zaleznosci - dzieki temu warstwa z npm ci jest w cache, dopoki package.json sie nie zmienia
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# przy starcie: migracje, seed admina (idempotentny), serwer
CMD ["sh", "-c", "npx knex migrate:latest && npx knex seed:run && node src/server.js"]
