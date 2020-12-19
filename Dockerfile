FROM node:12

RUN mkdir -p /var/www
WORKDIR /var/www

COPY . /var/www
RUN npm install

EXPOSE 3000

CMD [ "npm", "run", "start" ]