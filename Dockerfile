COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "server.js" ]