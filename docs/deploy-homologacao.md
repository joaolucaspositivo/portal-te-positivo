# Deploy de Homologação — Portal TE

## 1. Objetivo

Este documento descreve o processo de deploy de homologação do Portal TE.

A homologação tem como objetivo validar o Portal TE em um ambiente próximo de produção, fora da máquina local de desenvolvimento, antes do lançamento oficial para os usuários.

Este ambiente deve permitir validar:

* Aplicação rodando via Docker;
* Banco Postgres persistente;
* Uploads persistentes;
* Variáveis de ambiente reais;
* SMTP configurado;
* Migrations aplicadas;
* Logs acessíveis;
* Backup e restauração planejados;
* Fluxos principais funcionando em ambiente real.

---

## 2. Escopo da homologação

A homologação não representa o lançamento oficial do Portal TE.

Ela deve ser usada inicialmente por:

* João Lucas;
* Equipe da Tecnologia Educacional;
* Usuários internos convidados para teste;
* Coordenador da TE, quando necessário.

A homologação deve validar:

* Páginas públicas;
* Cadastro e login;
* Perfis de acesso;
* Solicitações;
* Configurações;
* Unidades;
* Tipos de solicitação;
* Ferramentas;
* Comunicados;
* Contatos;
* Upload;
* Notificações por e-mail;
* Estabilidade do deploy.

---

## 3. Pré-requisitos do servidor

O servidor de homologação deve possuir:

* Sistema operacional Linux;
* Docker instalado;
* Docker Compose instalado;
* Acesso ao repositório do Portal TE;
* Porta HTTP/HTTPS liberada;
* Espaço em disco para banco e uploads;
* Acesso SMTP, caso as notificações por e-mail sejam testadas;
* Rotina de backup definida.

Recomendação mínima para homologação:

* 2 vCPU;
* 4 GB RAM;
* 40 GB de disco;
* Ubuntu Server LTS ou distribuição Linux equivalente.

---

## 4. Estrutura esperada no servidor

Sugestão de diretório:

```txt
/opt/portal-te
```

Estrutura esperada:

```txt
/opt/portal-te
├── docker-compose.prod.yml
├── .env.production
├── uploads/
└── portal-te-positivo/
```

O repositório pode ser clonado diretamente em `/opt/portal-te/portal-te-positivo` ou em outro caminho definido pela equipe técnica.

---

## 5. Clonar o repositório

No servidor:

```bash
cd /opt
sudo mkdir -p portal-te
sudo chown -R $USER:$USER /opt/portal-te
cd /opt/portal-te

git clone https://github.com/joaolucaspositivo/portal-te-positivo.git
cd portal-te-positivo

git checkout dev
git pull origin dev
```

---

## 6. Criar arquivo de ambiente

Criar o arquivo:

```bash
cp .env.production.example .env.production
nano .env.production
```

O arquivo `.env.production` deve conter valores reais para homologação.

Exemplo:

```env
POSTGRES_PASSWORD="troque-por-uma-senha-forte"

JWT_SECRET="troque-por-um-segredo-forte"
JWT_REFRESH_SECRET="troque-por-outro-segredo-forte"

PUBLIC_APP_URL="https://portal-te-homologacao.seudominio.com.br"

UPLOAD_DIR="/app/uploads"

NODE_ENV="production"
PORT="8080"
HOST="0.0.0.0"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Portal TE <no-reply@example.com>"

PORTAL_TE_NOTIFICATION_EMAILS=""

GOOGLE_OAUTH_CLIENT_ID=""
GOOGLE_OAUTH_CLIENT_SECRET=""
```

Nunca commitar o arquivo `.env.production`.

---

## 7. Gerar segredos JWT

Os campos `JWT_SECRET` e `JWT_REFRESH_SECRET` devem ser fortes e diferentes.

Exemplo para gerar no Linux:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Usar o primeiro valor em:

```env
JWT_SECRET=""
```

Usar o segundo valor em:

```env
JWT_REFRESH_SECRET=""
```

---

## 8. Configurar senha do Postgres

A variável abaixo define a senha do usuário `portal` no Postgres:

```env
POSTGRES_PASSWORD=""
```

A senha deve ser forte e exclusiva para o ambiente.

O `docker-compose.prod.yml` usa essa senha para montar o `DATABASE_URL` da aplicação:

```txt
postgresql://portal:${POSTGRES_PASSWORD}@postgres:5432/portal_te?schema=public
```

---

## 9. Subir containers

No servidor, dentro da pasta do repositório:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Validar containers:

```bash
docker ps
```

Esperado:

```txt
portal-te-postgres-prod
portal-te-app-prod
```
curl http://localhost:8080/api/health
---

## 10. Rodar migrations

Depois que o Postgres estiver saudável, rodar:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Resultado esperado:

```txt
No pending migrations to apply.
```

Caso existam migrations pendentes, elas serão aplicadas.

---

## 11. Validar logs

Ver logs da aplicação:

```bash
docker logs portal-te-app-prod --tail 200
```

Ver logs do banco:

```bash
docker logs portal-te-postgres-prod --tail 200
```

Não devem aparecer erros críticos relacionados a:

```txt
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
UPLOAD_DIR
Prisma
permission denied
connection refused
Server function info not found
```

---

## 12. Validar aplicação no navegador

Acessar a URL configurada em `PUBLIC_APP_URL`.

Validar rotas públicas:

```txt
/
 /sobre
 /ferramentas
 /comunicados
 /contatos
 /solicitacoes
 /auth
```

Validar área autenticada:

```txt
/area-te
/area-te/configuracoes
/area-te/unidades
/area-te/tipos-solicitacao
/area-te/solicitacoes
/area-te/usuarios
```

---

## 13. Criar usuário admin inicial

No ambiente de homologação, criar o usuário inicial conforme regra atual do sistema.

E-mail previsto:

```txt
tecipp@colegiopositivo.com.br
```

Após o cadastro, validar:

* Login;
* Acesso à Área da TE;
* Dashboard;
* Menu lateral;
* Permissões de admin.

---

## 14. Checklist funcional de homologação

Validar:

```txt
Páginas públicas carregam
Cadastro funciona
Login funciona
Reset de senha funciona, se SMTP estiver configurado
Admin acessa dashboard
Configurações funcionam
Unidades funcionam
Tipos de solicitação funcionam
Campos dinâmicos funcionam
Abertura pública de solicitação funciona
Gestão interna de solicitação funciona
Alteração de status funciona
Alteração de prioridade funciona
Atribuição de responsável funciona
Comentário interno funciona
Histórico funciona
Usuário comum acessa apenas o permitido
Editor acessa apenas conteúdo
Equipe TE acessa solicitações
Usuário bloqueado não acessa
Upload funciona
E-mails não quebram o fluxo
Logs ficam limpos
```

---

## 15. Backup do banco

Criar backup manual do Postgres:

```bash
docker exec portal-te-postgres-prod pg_dump -U portal -d portal_te > backup_portal_te_$(date +%Y%m%d_%H%M%S).sql
```

Validar se o arquivo foi criado:

```bash
ls -lh backup_portal_te_*.sql
```

Recomendação:

* Backup diário em homologação;
* Backup antes de qualquer atualização;
* Armazenar cópia fora do servidor quando possível.

---

## 16. Backup dos uploads

Os uploads devem estar em volume persistente.

Criar backup:

```bash
tar -czf backup_uploads_portal_te_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

Validar:

```bash
ls -lh backup_uploads_portal_te_*.tar.gz
```

---

## 17. Restauração do banco

Para restaurar um backup SQL:

```bash
cat backup_portal_te.sql | docker exec -i portal-te-postgres-prod psql -U portal -d portal_te
```

Antes de restaurar, avaliar se será necessário limpar ou recriar o banco.

---

## 18. Atualizar nova versão

Para atualizar o ambiente de homologação:

```bash
cd /opt/portal-te/portal-te-positivo

git checkout dev
git pull origin dev

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma migrate deploy

docker logs portal-te-app-prod --tail 200
```

Depois da atualização, repetir o checklist funcional básico.

---

## 19. Checklist de go/no-go

Antes de liberar para homologação com usuários reais:

```txt
Containers estão rodando
Banco está saudável
Migrations aplicadas
Uploads persistentes
SMTP configurado ou comportamento sem SMTP validado
Admin inicial criado
Fluxo de solicitação testado
Permissões testadas
Logs sem erro crítico
Backup manual validado
Restauração documentada
URL final definida
Acesso restrito à equipe de homologação
```

Se algum item crítico falhar, não liberar homologação para usuários externos.

---

## 20. Observações importantes

* O ambiente de homologação pode conter dados fictícios ou dados reais limitados.
* Não usar senhas fracas.
* Não commitar arquivos `.env`.
* Não expor o banco Postgres publicamente.
* Manter volume de uploads persistente.
* Validar backup antes de qualquer atualização.
* Registrar erros encontrados durante a homologação.
* Toda alteração deve continuar passando pela branch `dev`.
