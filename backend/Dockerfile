# 1. Folosim imaginea oficială de .NET SDK pentru a compila codul
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 2. Copiem fișierele .csproj și instalăm dependențele
COPY *.csproj ./
RUN dotnet restore

# 3. Copiem restul codului și îl compilăm pentru producție
COPY . ./
RUN dotnet publish -c Release -o out

# 4. Folosim o imagine mai mică, doar pentru rulare (fără SDK)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# 5. Expunem portul standard pe care rulează .NET 8 în Docker
EXPOSE 8080


ENTRYPOINT ["dotnet", "backend.dll"]