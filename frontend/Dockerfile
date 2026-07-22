# 1. ETAPA DE BUILD (Bucătăria) - Folosim un mediu cu Node.js instalat
FROM node:20-alpine AS build
WORKDIR /app

# Copiem fișierele care conțin lista de librării și le instalăm
# (Acest pas e separat pentru optimizare / caching, la fel ca la .csproj)
COPY package*.json ./
RUN npm install

# Copiem restul codului Frontend în container
COPY . .

# Setăm adresa Backend-ului ca să fie "arsă" în cod la compilare
ENV VITE_API_URL=http://localhost:5000

# Construim versiunea finală a aplicației (optimizată)
RUN npm run build

# 2. ETAPA DE RULARE (Sala de mese) - Folosim Nginx pentru a servi aplicația
FROM nginx:alpine

# Copiem rezultatul din Etapa 1 în folderul special pe care îl folosește Nginx
# ATENȚIE: Dacă folosești Create React App (nu Vite), schimbă /app/dist cu /app/build
COPY --from=build /app/dist /usr/share/nginx/html

# Expunem portul 80 (portul standard pentru site-uri web statice)
EXPOSE 80

# Nginx pornește automat, deci nu mai trebuie să scriem o comandă de ENTRYPOINT