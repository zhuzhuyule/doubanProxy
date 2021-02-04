FROM node:14.14.0

# ENV SERVER_PORT ${SERVER_PORT}
ENV MONGODB_HOST ${MONGODB_HOST}
ENV MONGODB_PORT ${MONGODB_PORT}

COPY tsconfig.json /app/tsconfig.json
COPY package.json /app/package.json
COPY ./server /app/server

WORKDIR /app

RUN yarn config set registry https://registry.npm.taobao.org/ && yarn

EXPOSE 3000

ENTRYPOINT [ "yarn", "start" ]
