FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Se instalan todas las dependencias porque TypeScript está en devDependencies
# y se requiere para compilar el proyecto.
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/app.js"]
