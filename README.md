# Saúde 360 PSF - Frontend

Interface web do sistema Saúde 360 PSF, desenvolvida com React, TypeScript e Vite.

## 🚀 Tecnologias

- **React** 19.x
- **TypeScript** 5.x
- **Vite** 7.x (Build tool)
- **React Router** 6.x (Roteamento)
- **React Query** 5.x (Cache e sincronização)
- **Zustand** 5.x (Estado global)
- **Axios** 1.x (HTTP client)
- **Framer Motion** 12.x (Animações)
- **Lucide React** 0.x (Ícones)
- **Recharts** 3.x (Gráficos)
- **date-fns** 4.x (Manipulação de datas)

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Backend rodando em `http://localhost:3000`

## 🔧 Instalação

1. Clone o repositório e entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com a URL da API:
```env
VITE_API_URL=http://localhost:3000/v1
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

A aplicação estará rodando em `http://localhost:5173`

### Produção
```bash
npm run build
npm run preview
```

## 📚 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com hot reload
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o ESLint
- `npm run format` - Formata o código com Prettier

## 🎨 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── AppointmentModal.tsx
│   │   ├── ChronicConsultationModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── HomeVisitModal.tsx
│   │   ├── IndicatorCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MicroAreaModal.tsx
│   │   ├── PatientActionsMenu.tsx
│   │   ├── PatientFiltersModal.tsx
│   │   ├── PatientModal.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── QuickStats.tsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── Alerts.tsx
│   │   ├── Appointments.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Indicators.tsx
│   │   ├── LabExams.tsx
│   │   ├── Login.tsx
│   │   ├── MicroAreas.tsx
│   │   ├── PatientDetails.tsx
│   │   ├── Patients.tsx
│   │   ├── Settings.tsx
│   │   ├── Users.tsx
│   │   └── Vaccines.tsx
│   ├── layouts/
│   │   └── RootLayout.tsx
│   ├── services/
│   │   └── api.ts         # Configuração Axios
│   ├── stores/
│   │   └── authStore.ts   # Estado global de autenticação
│   ├── App.tsx            # Rotas principais
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globais
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. O token é armazenado no localStorage e incluído automaticamente em todas as requisições.

### Login
```typescript
import { useAuthStore } from './stores/authStore';

const { login } = useAuthStore();
await login('12345678900', 'senha123');
```

### Logout
```typescript
const { logout } = useAuthStore();
logout();
```

### Verificar Permissões
```typescript
const { user } = useAuthStore();

if (user?.role === 'ADMIN') {
  // Acesso administrativo
}
```

## 📱 Páginas Principais

### Dashboard
- Estatísticas gerais da unidade
- Gráfico de saúde populacional
- Lista de busca ativa prioritária
- Filtros por microárea e ACS

### Pacientes
- Listagem com paginação
- Busca e filtros avançados
- Cadastro multi-etapa (3 passos)
- Detalhes completos do paciente
- Timeline de eventos
- Indicadores individuais

### Vacinas
- Busca de pacientes
- Calendário vacinal personalizado
- Registro de aplicações
- Resumo de pendências
- Status visual por cores

### Exames Laboratoriais
- Criação de solicitações
- Seleção de múltiplos exames
- Listagem com filtros
- Exames pendentes de avaliação
- Avaliação rápida

### Alertas
- Consultas programadas (próximos 7 dias)
- Pacientes prioritários por categoria
- Filtros por tipo de alerta
- Contadores por categoria

### Indicadores
- Dashboard com 12 indicadores
- Status em tempo real
- Detalhamento por indicador
- Ações sugeridas

### Consultas
- Listagem de agendamentos
- Filtros por data, tipo, status
- Modal de agendamento
- Gerenciamento de status

### Microáreas (Admin)
- CRUD completo
- Atribuição de ACS
- Contagem de pacientes

### Equipe (Admin)
- CRUD de usuários
- Atribuição de perfis
- Ativar/desativar usuários

## 🎨 Componentes Reutilizáveis

### PatientModal
Modal de cadastro de paciente em 3 etapas.

```tsx
<PatientModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

### AppointmentModal
Modal de agendamento de consultas.

```tsx
<AppointmentModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  patientId="123"
  patientName="João Silva"
/>
```

### LoadingSpinner
Componente de loading.

```tsx
<LoadingSpinner 
  fullScreen={true}
  message="Carregando..."
/>
```

### EmptyState
Estado vazio com ação opcional.

```tsx
<EmptyState
  icon={Users}
  title="Nenhum paciente encontrado"
  message="Tente ajustar os filtros"
  action={{
    label: "Cadastrar Paciente",
    onClick: () => {}
  }}
/>
```

## 🌐 Integração com API

### React Query
O projeto utiliza React Query para cache e sincronização de dados.

```tsx
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const { data, isLoading, error } = useQuery({
  queryKey: ['patients'],
  queryFn: async () => {
    const response = await api.get('/patients');
    return response.data.data;
  }
});
```

### Mutations
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    return await api.post('/patients', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  }
});

mutation.mutate(formData);
```

## 🎨 Estilos

O projeto utiliza CSS puro com variáveis CSS para temas.

### Variáveis Principais
```css
:root {
  --primary: #1e3a8a;
  --accent: #f59e0b;
  --success: #10b981;
  --danger: #ef4444;
  --status-green: #10b981;
  --status-yellow: #f59e0b;
  --status-red: #ef4444;
}
```

### Classes Utilitárias
- `.card` - Card padrão
- `.card.glass` - Card com efeito glass
- `.btn` - Botão padrão
- `.btn-primary` - Botão primário
- `.input` - Input padrão
- `.grid` - Grid layout
- `.status-dot` - Indicador de status

## 🔍 Debugging

### React Query Devtools
As devtools do React Query estão habilitadas em desenvolvimento para facilitar o debug de queries e mutations.

### Console Logs
Use `console.log`, `console.error` e `console.warn` para debug durante o desenvolvimento.

## 📦 Build

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
```

O build será gerado na pasta `dist/`.

### Preview do Build
```bash
npm run preview
```

## 🧪 Testes (Futuro)

```bash
npm test
```

## 📝 Convenções de Código

- Componentes em PascalCase
- Funções em camelCase
- Constantes em UPPER_SNAKE_CASE
- Interfaces com prefixo I

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça commits: `git commit -m "feat: adiciona nova funcionalidade"`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação em `docs/`
2. Verifique issues existentes
3. Abra uma nova issue com detalhes

---

**Versão**: 3.1.0  
**Última Atualização**: 2026-02-15

Para mais informações, consulte a [documentação completa](../docs/).
