# functions/Dockerfile

# Usa imagem oficial do Azure Functions para Node.js 18
FROM mcr.microsoft.com/azure-functions/node:4-node18

# Define diretório de trabalho
WORKDIR /home/site/wwwroot

# Copia o código das functions
COPY . .

# Porta padrão do Azure Functions
EXPOSE 80

# Azure Functions inicia automaticamente via entrypoint padrão
