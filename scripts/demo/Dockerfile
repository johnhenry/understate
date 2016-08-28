FROM mhart/alpine-node
COPY run .
RUN chmod +x run
COPY package.json .
RUN npm install
copy demo /demo
CMD ./run
