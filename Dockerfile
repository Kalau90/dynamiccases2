FROM node:12.16.1

WORKDIR /usr/src/app

# Dont skip this step. It is for caching.
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]