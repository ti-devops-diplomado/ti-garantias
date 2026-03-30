FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/TiGarantias.Api/TiGarantias.Api.csproj src/TiGarantias.Api/
RUN dotnet restore src/TiGarantias.Api/TiGarantias.Api.csproj

COPY src/TiGarantias.Api/ src/TiGarantias.Api/
RUN dotnet publish src/TiGarantias.Api/TiGarantias.Api.csproj -c Release -o /app/publish /p:UseAppHost=false -v normal

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TiGarantias.Api.dll"]
