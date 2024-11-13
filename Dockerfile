
FROM node:22.11.0-alpine

WORKDIR /app

COPY package*.json /app/

RUN apk add --no-cache bash
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
