FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY fixtures ./fixtures

EXPOSE 8080

CMD ["npm", "start"]
