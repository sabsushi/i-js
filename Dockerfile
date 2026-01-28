FROM node

WORKDIR /app
COPY ./src /app/src

RUN npm install -g npm@11.8.0

CMD ["bash"]