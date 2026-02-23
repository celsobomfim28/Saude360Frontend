# Plano de Correção — Frontend (Cadastro de Paciente 400 Bad Request)

## 1) Contexto do problema

No fluxo de cadastro em múltiplos passos (`PatientModal`), o envio do formulário conclui no passo 3, mas a API retorna **400 Bad Request**.

Arquivo principal analisado:

- `frontend/src/components/PatientModal.tsx`

O frontend já valida campos obrigatórios básicos e monta o payload, porém ainda há risco de envio de campos opcionais em formato não ideal para o backend.

---

## 2) Objetivo da correção

- Enviar payload **estritamente compatível** com o contrato da API.
- Reduzir erros por `string vazia` em campos opcionais/datas.
- Melhorar o feedback ao usuário quando ocorrer erro 400/422.

---

## 3) Causas prováveis no frontend

1. **Envio de opcionais como `""`** em vez de omitir o campo.
   - Pode conflitar com regras de validação/persistência no backend.
2. **Sanitização parcial de dados numéricos** (CPF, CNS, CEP, telefones).
   - Máscaras e espaços podem passar em cenários específicos.
3. **Mensagens de erro pouco acionáveis** para suporte/usuário final.
   - Necessário exibir `code` e `details` da API quando disponíveis.

---

## 4) Plano técnico (frontend)

### 4.1 Refatorar montagem do payload

Arquivo alvo: `frontend/src/components/PatientModal.tsx`

Ações:

- Criar função utilitária local (ou compartilhada) para normalização:
  - `emptyToUndefined(value)`
  - `onlyDigits(value)`
- Construir payload final removendo campos opcionais sem valor real.
- Evitar envio de datas opcionais como `""`; enviar apenas quando preenchidas.

Resultado esperado:

- Menor chance de rejeição por formato em campos opcionais.

---

### 4.2 Sanitização consistente antes do submit

Ações:

- Aplicar `onlyDigits` em:
  - `cpf`, `cns`, `primaryPhone`, `secondaryPhone`, `address.zipCode`
- Garantir `birthDate` em formato ISO válido somente quando existir.
- Para datas opcionais de elegibilidade (ex.: `lastMenstrualDate`), só enviar quando preenchidas.

Resultado esperado:

- Payload limpo e previsível.

---

### 4.3 Validação de UX no cliente (pré-submit)

Ações:

- Manter validação de obrigatórios de identificação/endereço.
- Adicionar validações simples de consistência:
  - CPF com 11 dígitos (após sanitização);
  - CNS com 15 dígitos quando informado;
  - telefone com 10/11 dígitos quando informado;
  - se `isPregnant = true`, exigir `lastMenstrualDate`.

Resultado esperado:

- Redução de roundtrip com erro evitável.

---

### 4.4 Melhorar tratamento de erro da API

Ações:

- No `onError` da mutation:
  - Priorizar exibição de `error.response.data.error.message`;
  - Quando houver `details`, renderizar lista amigável por campo;
  - Se houver `error.code`, incluir no texto para suporte.
- Padronizar fallback para mensagens desconhecidas.

Resultado esperado:

- Usuário e equipe conseguem identificar causa de forma rápida.

---

## 5) Critérios de aceite (frontend)

1. Payload enviado não contém `""` para campos opcionais sensíveis.
2. Campos numéricos chegam sem máscara.
3. Erros 400/422 apresentam mensagem clara e campo afetado quando disponível.
4. Fluxo dos 3 passos mantém usabilidade e não dispara submit indevido.

---

## 6) Roteiro de testes rápidos

### Cenário A — Cadastro básico válido

- Preencher obrigatórios e enviar.
- Esperado: sucesso e invalidação da query `patients`.

### Cenário B — Opcionais em branco

- Não preencher CNS, email, telefone secundário, etc.
- Esperado: payload sem lixo e criação concluída.

### Cenário C — Gestante sem DUM

- Marcar gestante sem data de última menstruação.
- Esperado: bloqueio no cliente ou mensagem de validação clara do backend.

### Cenário D — Microárea inválida (simulada)

- Forçar microAreaId inválido (teste técnico).
- Esperado: mensagem amigável baseada no `code/message` retornado.

---

## 7) Riscos e mitigação

- **Risco:** remover campo opcional necessário em algum cenário de integração.
  - **Mitigação:** alinhar contrato com backend e validar em staging.
- **Risco:** excesso de validação no cliente gerar fricção.
  - **Mitigação:** manter validações essenciais e mensagens objetivas.

---

## 8) Entrega incremental sugerida

1. PR 1: utilitários de sanitização + payload limpo.
2. PR 2: melhoria de mensagens de erro e UX de validação.
3. PR 3: testes manuais guiados + documentação de cenários.
