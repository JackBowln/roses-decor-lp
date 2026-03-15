# Testing Strategy

## Diagnóstico atual

- A base já possuía testes rápidos com `node --test` para helpers puros.
- Não havia stack preparada para testar componentes Vue, composables com runtime Nuxt ou suítes segmentadas por tipo.
- A cobertura estava concentrada em poucos arquivos de configuração/copy, sem proteção suficiente para:
  - regras de cálculo
  - normalização de domínio
  - validação do pré-orçamento
  - componentes base compartilhados

## Stack adotada

- Runner legado mantido: `node --test`
- Nova stack preparada para adoção incremental:
  - `vitest`
  - `@vue/test-utils`
  - `@nuxt/test-utils`
  - `happy-dom`

## Estrutura

- `tests/unit/lib`
- `tests/unit/server`
- `tests/components`
- `tests/nuxt`
- `tests/factories`
- `tests/fixtures`
- `tests/setup`

## Scripts

- `npm test`
  - mantém o runner legado
- `npm run test:legacy`
  - executa apenas os testes existentes em `node --test`
- `npm run test:unit`
  - executa helpers puros e regras de domínio
- `npm run test:components`
  - executa componentes Vue em `happy-dom`
- `npm run test:nuxt`
  - executa a suíte compatível com runtime Nuxt
- `npm run test:vitest`
  - executa todos os projetos do Vitest
- `npm run test:all`
  - legado + Vitest

## Cobertura inicial desta fase

### Domínio

- `app/lib/fieldMasks.ts`
- `app/lib/publicQuoteForm.ts`
- `app/lib/adminQuote.ts`
- `app/lib/sales.ts`
- `app/lib/quoteWorkspace.ts`
- `server/utils/quoteWorkspacePolicy.ts`

### Componentes base

- `app/components/app/AppButton.vue`
- `app/components/app/AppInput.vue`
- `app/components/app/AppField.vue`
- `app/components/app/AppStatusBadge.vue`

### UI pequena do pré-orçamento

- `app/components/ui/quote-form/QuoteSummaryCard.vue`
- `app/components/ui/quote-form/QuoteFormProgress.vue`

## Helpers compartilhados

- `tests/setup/mount.ts`
  - helper de mount com stubs reutilizáveis para `NuxtLink`, `Motion` e `AnimatePresence`
- `tests/setup/vitest.setup.ts`
  - stubs de DOM e setup global do `@vue/test-utils`
- `tests/factories/*`
  - factories de domínio para pré-orçamento, orçamento e vendas

## Convenções

- Arquivos de teste:
  - `*.spec.ts` para a nova suíte Vitest
  - `*.test.mjs` preservados para o runner legado
- Prioridade:
  - comportamento observável
  - regras sensíveis
  - fallbacks e fluxos de erro
- Evitar:
  - snapshots frágeis
  - mocks desnecessários
  - testes de detalhe interno sem valor funcional

## Expansão recomendada

### Fase 2

- componentes de formulário adicionais
- componentes administrativos pequenos
- badges, dialogs, action menus e navegação simples

### Fase 3

- composables com dependências bem isoladas
- regras de documento e delivery
- componentes médios da gestão

### Fase 4

- composables grandes de gestão
- runtime Nuxt mais acoplado
- fluxos críticos da área administrativa

## Checklist para a próxima fase

- instalar a stack nova de testes no ambiente
- validar `test:unit`, `test:components` e `test:nuxt`
- cobrir `app/lib/adminQuoteManagement.ts`
- cobrir `app/lib/adminQuoteDocumentState.ts`
- começar a testar componentes reutilizáveis da gestão
- introduzir testes de composables com runtime Nuxt onde o risco de regressão é maior
