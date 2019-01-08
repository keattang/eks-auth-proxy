FROM node:10.15-alpine

WORKDIR /app

RUN yarn global add pm2 -g

COPY package.json yarn.lock /app/

RUN yarn install

COPY . /app

CMD ./start