FROM node:18-slim

RUN apt-get update && apt-get install -y curl vim

WORKDIR /cord

COPY . .

RUN npm install -g npm@10.8.2

RUN npm install

RUN npm run build

EXPOSE 8161 8179

RUN chmod +x start_node.sh
CMD ["./start_node.sh"]