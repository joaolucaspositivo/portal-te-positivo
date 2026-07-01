# Deploy — Portal TE

Este documento descreve o deploy inicial do Portal TE em uma VPS usando Docker Compose.

## 1. Pré-requisitos

Na VPS:

- Docker instalado;
- Docker Compose disponível;
- Git instalado;
- Porta 8080 liberada ou proxy reverso configurado;
- Domínio apontando para a VPS, se aplicável.

## 2. Clonar o repositório

```bash
git clone https://github.com/joaolucaspositivo/portal-te-positivo.git
cd portal-te-positivo
git checkout dev