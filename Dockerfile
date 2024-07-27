FROM node:22.4.0-alpine

WORKDIR /ai-digit

RUN mkdir -p /ai-digit
COPY ./ /ai-digit

ENV NODE_ENV=production

RUN npm install --omit=dev

CMD ["help"]
ENTRYPOINT ["node", "."]
#CMD while true; do sleep 5; done

