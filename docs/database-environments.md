# Database Environments

## Envs obrigatórias

A aplicação resolve o banco ativo a partir de `APP_DB_TARGET`.

Valores aceitos:
- `development`
- `test`
- `production`

Para cada target, configure a URL correspondente:
- `DATABASE_URL_DEVELOPMENT`
- `DATABASE_URL_TEST`
- `DATABASE_URL_PRODUCTION`

Exemplo:

```env
APP_DB_TARGET=development
DATABASE_URL_DEVELOPMENT=postgres://...
DATABASE_URL_TEST=postgres://...
DATABASE_URL_PRODUCTION=postgres://...
```

## Como a aplicação escolhe o banco

- O target ativo vem de `APP_DB_TARGET`.
- A URL é lida da env correspondente ao target.
- Se o target for inválido ou a URL estiver ausente, a aplicação falha de forma explícita.
- O runtime registra em log qual target e qual env foram usados, sem expor credenciais.

## Seeds mock

Os scripts mock usam o mesmo target ativo e persistem dados diretamente no banco selecionado.

Perfis disponíveis:
- `small`
- `medium`
- `large`
- `sales-heavy`
- `operations-heavy`

Exemplos:

```bash
npm run db:seed:mock
npm run db:seed:mock -- --profile=small
npm run db:seed:mock -- --profile=sales-heavy --seed=123
npm run db:seed:mock -- --profile=medium --reset
```

O seed gera dados coerentes para:
- clientes
- pré-orçamentos
- orçamentos finais
- vendas
- costureiras
- instaladores
- tecidos
- saldos de estoque
- movimentações de estoque
- despachos de instalador

## Reset e repopulação

Reset explícito por target:

```bash
npm run db:reset:dev
npm run db:reset:test
```

Repopular do zero:

```bash
npm run db:reseed:dev
npm run db:reseed:test
```

## Segurança

- Seeds mock são bloqueados em `production` por padrão.
- Reset é sempre bloqueado em `production`.
- Para liberar seed mock em produção manualmente, são exigidas duas proteções explícitas:
  - `ALLOW_MOCK_SEED_IN_PROD=true`
  - `--confirm=ALLOW_PRODUCTION_MOCK_SEED`

Exemplo manual extremo:

```bash
APP_DB_TARGET=production \
ALLOW_MOCK_SEED_IN_PROD=true \
npm run db:seed:mock -- --confirm=ALLOW_PRODUCTION_MOCK_SEED
```

Esse fluxo existe apenas para contingência controlada. Não use em operação normal.
