FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/Domain/MessengerApp.Domain.csproj", "src/Domain/"]
COPY ["src/Application/MessengerApp.Application.csproj", "src/Application/"]
COPY ["src/Infrastructure/MessengerApp.Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/WebAPI/MessengerApp.WebAPI.csproj", "src/WebAPI/"]

RUN dotnet restore "src/WebAPI/MessengerApp.WebAPI.csproj"

COPY src/ ./src/
RUN dotnet publish "src/WebAPI/MessengerApp.WebAPI.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=10000

COPY --from=build /app/publish ./

EXPOSE 10000

ENTRYPOINT ["dotnet", "MessengerApp.WebAPI.dll"]