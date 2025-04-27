# Використовуємо легковажний образ Node.js
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json і package-lock.json для встановлення залежностей
COPY package*.json ./

# Встановлюємо лише production-залежності
RUN npm install --production

# Копіюємо весь проєкт у контейнер
COPY . .

# Виставляємо порт (той, що додаток використовує)
EXPOSE 1488

# Команда для запуску додатка
CMD ["npm", "run", "start:prod"]