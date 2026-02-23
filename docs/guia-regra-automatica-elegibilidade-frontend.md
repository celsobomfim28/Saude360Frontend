# Guia — Regra Automática de Elegibilidade no Frontend (Passo 3 do PatientModal)

## 1) Objetivo

Implementar no frontend a marcação automática dos critérios de elegibilidade no passo 3 do cadastro de paciente, para melhorar a UX e reduzir erro manual:

- `isChild`
- `isElderly`
- `isWoman`

> Observação: o backend continua sendo a fonte de verdade e já recalcula essas regras. A automação no frontend é de apoio visual/operacional.

---

## 2) Arquivo alvo

- `frontend/src/components/PatientModal.tsx`

---

## 3) Regras de negócio a aplicar no frontend

Com base em `birthDate` e `sex`:

1. **Criança (`isChild`)**
   - `true` se idade < 24 meses.

2. **Idoso (`isElderly`)**
   - `true` se idade >= 60 anos.

3. **Saúde da Mulher (`isWoman`)**
   - `true` se `sex === 'FEMALE'` e idade entre 9 e 69 anos.

Essas regras devem espelhar a lógica já usada no backend para consistência.

---

## 4) Implementação sugerida

### 4.1 Criar função de cálculo

Dentro do `PatientModal.tsx`, criar helper para calcular idade em meses/anos a partir de `birthDate`.

Exemplo (pseudo-código):

```ts
const computeDerivedEligibility = (birthDate: string, sex: string) => {
  if (!birthDate) return { isChild: false, isElderly: false, isWoman: false };

  const birth = new Date(birthDate + 'T00:00:00');
  const today = new Date();

  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  const ageInYears = Math.floor(ageInMonths / 12);

  return {
    isChild: ageInMonths < 24,
    isElderly: ageInYears >= 60,
    isWoman: sex === 'FEMALE' && ageInYears >= 9 && ageInYears <= 69,
  };
};
```

### 4.2 Atualizar automaticamente com `useEffect`

Escutar `formData.birthDate` e `formData.sex`:

```ts
useEffect(() => {
  const derived = computeDerivedEligibility(formData.birthDate, formData.sex);
  setFormData(prev => ({
    ...prev,
    eligibilityCriteria: {
      ...prev.eligibilityCriteria,
      isChild: derived.isChild,
      isElderly: derived.isElderly,
      isWoman: derived.isWoman,
    }
  }));
}, [formData.birthDate, formData.sex]);
```

### 4.3 Comportamento de UI recomendado

- Exibir esses critérios como **auto-calculados** (label/tooltip).
- Opcional: desabilitar os checkboxes de `isChild`, `isElderly`, `isWoman` para evitar conflito manual.
- Manter checkboxes manuais para critérios clínicos:
  - `isPregnant`, `isPostpartum`, `hasHypertension`, `hasDiabetes`.

---

## 5) Compatibilidade com backend

Mesmo com regra no frontend:

- O backend deve continuar recalculando `isChild`, `isElderly`, `isWoman`.
- O frontend não deve assumir autoridade final desses campos.

Isso evita inconsistência em casos de timezone, manipulação manual de payload ou versões diferentes da UI.

---

## 6) Checklist de testes

### Teste A — Criança

- Data de nascimento com menos de 2 anos.
- Esperado: `isChild = true`, `isElderly = false`, `isWoman` conforme sexo/faixa.

### Teste B — Idoso

- Data de nascimento com 60+ anos.
- Esperado: `isElderly = true`.

### Teste C — Mulher elegível (9 a 69)

- `sex = FEMALE`, idade 30.
- Esperado: `isWoman = true` automaticamente no passo 3.

### Teste D — Mulher fora da faixa

- `sex = FEMALE`, idade 75.
- Esperado: `isWoman = false`.

### Teste E — Sexo masculino

- `sex = MALE`, qualquer idade.
- Esperado: `isWoman = false`.

### Teste F — Mudança dinâmica

- Alterar `sex` e `birthDate` no passo 1 e navegar até passo 3.
- Esperado: critérios derivados atualizados sem ação manual.

---

## 7) Riscos e mitigação

1. **Risco:** divergência de cálculo entre frontend e backend.
   - **Mitigação:** manter fórmula equivalente e backend soberano.

2. **Risco:** sobrescrever escolha manual de usuário.
   - **Mitigação:** para critérios derivados, preferir campo somente leitura/auto.

3. **Risco:** bugs de timezone.
   - **Mitigação:** padronizar parsing da data (`T00:00:00`) e validar com testes.

---

## 8) Critérios de aceite

- No passo 3, `isWoman` aparece automaticamente marcado quando paciente for `FEMALE` e 9–69 anos.
- `isChild` e `isElderly` também refletem automaticamente a idade.
- Payload enviado ao backend já contém esses valores coerentes.
- Backend continua confirmando/corrigindo os derivados no processamento final.
