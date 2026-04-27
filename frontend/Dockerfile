FROM node:22-alpine AS build-stage
WORKDIR /app

COPY package*.json ./

RUN npm audit fix

RUN npm install

COPY . .

RUN npx update-browserslist-db@latest

RUN npm run build

FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
