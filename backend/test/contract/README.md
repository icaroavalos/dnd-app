# Contract Tests

Testes de contrato para validação da API e DTOs.

## Objetivo

Estes testes garantem que:

1. **API Error Shape** - Todos os erros seguem o formato padrão
2. **DTO Shapes** - Requests/responses aceitam e retornam estruturas consistentes
3. **Compatibilidade** - Mudanças quebrando contrato são detectadas

## Estrutura

- `api-error-shape.spec.ts` - Testa o formato de erros da API
- `dto-shape.spec.ts` - Testa o formato de DTOs de entrada/saída

## Padrão de Erro da API

Todos os erros devem seguir:

```json
{
  "statusCode": 400,
  "error": {
    "code": "RESOURCE_UNAVAILABLE",
    "message": "Resource does not have enough uses remaining."
  },
  "path": "/resources/use",
  "requestId": "req-abc123"
}
```

**Campos obrigatórios:**
- `statusCode` (number): Código HTTP
- `error.code` (string): Código do erro (SCREAMING_SNAKE_CASE)
- `error.message` (string): Mensagem amigável
- `path` (string): Caminho da requisição
- `requestId` (string): ID para tracing (formato: `req-*`)

## Execução

```bash
# Rodar todos os testes de contrato
npm test -- test/contract/*.spec.ts

# Rodar apenas teste de error shape
npm test -- --test-name-pattern="API error shape"

# Rodar apenas teste de DTO shape
npm test -- --test-name-pattern="DTO shape"
```

## Critérios de Aceite

### Para novos endpoints:

- [ ] Teste de shape de resposta (sucesso)
- [ ] Teste de shape de erro (falha)
- [ ] Teste de campos obrigatórios
- [ ] Teste de campos opcionais
- [ ] Teste de tipos (string, number, boolean, array)

### Para novos DTOs:

- [ ] Documentação em `dto/README.md`
- [ ] Teste de shape no `dto-shape.spec.ts`
- [ ] Teste de valores padrão (optionals)
- [ ] Teste de validação (se aplicável)

## Histórico

- **v1.0** (2026-05): Criação dos primeiros testes de contrato
