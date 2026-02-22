# Integração com Mapas - Saúde 360 PSF

## Visão Geral

A integração com mapas foi implementada usando **Leaflet** e **React-Leaflet**, bibliotecas open-source para mapas interativos. A funcionalidade está disponível na tela de **Territorialização**.

## Como Funciona a Integração com Endereços

### 1. Geocodificação de Endereços

O sistema converte endereços de pacientes em coordenadas geográficas (latitude/longitude) através de um processo chamado **geocodificação**.

**Serviço utilizado:** Nominatim (OpenStreetMap) - Gratuito e open-source

**Processo:**
1. O sistema pega o endereço completo do paciente (rua, número, bairro, CEP)
2. Envia para a API do Nominatim
3. Recebe as coordenadas (latitude/longitude)
4. Salva no banco de dados na tabela `patients`

### 2. Campos Adicionados na Tabela Patients

```sql
latitude DOUBLE PRECISION    -- Coordenada de latitude
longitude DOUBLE PRECISION   -- Coordenada de longitude
geocodedAt TIMESTAMP(3)      -- Data/hora da geocodificação
```

### 3. Como Geocodificar Pacientes

#### Opção 1: Via Interface (Recomendado)

1. Acesse a tela **Territorialização**
2. Clique no botão **"Geocodificar X pacientes"** no topo da página
3. Confirme a operação
4. Aguarde o processo (geocodifica 10 pacientes por vez)
5. Repita até geocodificar todos

#### Opção 2: Via Script (Backend)

```bash
# Geocodificar 10 pacientes
npm run geocode

# Geocodificar 50 pacientes
npm run geocode 50

# Geocodificar todos
npm run geocode 999999
```

#### Opção 3: Via API

```bash
# Geocodificar um paciente específico
POST /v1/geocoding/patient/:patientId

# Geocodificar em lote (10 por vez)
POST /v1/geocoding/batch
{
  "limit": 10,
  "microAreaId": "uuid-opcional"
}

# Ver estatísticas
GET /v1/geocoding/stats
```

### 4. Limitações e Boas Práticas

**Política do Nominatim (OpenStreetMap):**
- Máximo 1 requisição por segundo
- Uso justo e razoável
- Não fazer requisições em massa sem intervalo

**Implementação no Sistema:**
- Delay automático de 1 segundo entre requisições
- Limite de 10 pacientes por operação via interface
- Logs detalhados de cada geocodificação

### 5. Endereços que Podem Falhar

Alguns endereços podem não ser geocodificados com sucesso:
- Endereços incompletos ou incorretos
- Ruas muito novas (não cadastradas no OpenStreetMap)
- Áreas rurais sem mapeamento detalhado
- Endereços com erros de digitação

**Solução:** Revisar e corrigir os endereços dos pacientes que falharam.

## Tecnologias Utilizadas

- **Leaflet** (v1.9.4): Biblioteca JavaScript para mapas interativos
- **React-Leaflet** (v4.2.1): Componentes React para Leaflet
- **OpenStreetMap**: Fonte de tiles de mapa (gratuito e open-source)
- **Nominatim**: API de geocodificação (gratuito e open-source)

## Funcionalidades Implementadas

### 1. Mapa de Calor de Indicadores

Visualização geográfica de pacientes com indicadores críticos:

- **Marcadores coloridos** baseados no status:
  - 🔴 Vermelho: Pacientes com indicadores críticos (RED)
  - 🟡 Amarelo: Pacientes com indicadores de atenção (YELLOW)
  - 🟢 Verde: Pacientes com indicadores normais (GREEN)

- **Informações no marcador**:
  - Nome do paciente
  - Microárea
  - Número de indicadores críticos
  - Status geral

- **Filtros disponíveis**:
  - Por microárea
  - Por indicador específico (B1, B4, C1, C4, D4, E4)
  - Por status (GREEN, YELLOW, RED)

### 2. Pontos Críticos

Lista lateral mostrando os 10 pacientes mais críticos com:
- Nome do paciente
- Microárea
- Número de indicadores críticos

### 3. Áreas de Risco

Identificação automática de áreas com alta concentração de pacientes críticos:
- Clustering de pontos próximos (~1km)
- Classificação de risco (Alto, Médio, Baixo)
- Contagem de pacientes e indicadores críticos

### 4. Cobertura Territorial

Estatísticas de cobertura:
- Total de pacientes com localização cadastrada
- Taxa de cobertura (%)
- Visitas realizadas nos últimos 30 dias
- Pacientes sem localização

## Componente InteractiveMap

### Localização
`frontend/src/components/InteractiveMap.tsx`

### Props

```typescript
interface InteractiveMapProps {
  points: MapPoint[];           // Array de pontos para exibir
  center?: [number, number];    // Centro inicial do mapa [lat, lng]
  zoom?: number;                // Nível de zoom inicial (padrão: 13)
  height?: string;              // Altura do mapa (padrão: '500px')
  onMarkerClick?: (point: MapPoint) => void;  // Callback ao clicar em marcador
}

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  patientName: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  criticalCount?: number;
  microArea?: string;
}
```

### Exemplo de Uso

```tsx
import InteractiveMap from '../components/InteractiveMap';

<InteractiveMap
  points={[
    {
      id: '123',
      lat: -15.7942,
      lng: -47.8822,
      patientName: 'João Silva',
      status: 'RED',
      criticalCount: 3,
      microArea: 'Microárea 01',
    },
  ]}
  height="600px"
  onMarkerClick={(point) => console.log('Clicou em:', point)}
/>
```

## Backend - Endpoints

### POST /v1/territorialization/heatmap

Retorna pontos para o mapa de calor.

**Body:**
```json
{
  "microAreaId": "uuid-opcional",
  "indicator": "C1",  // opcional
  "status": "RED"     // opcional: GREEN, YELLOW, RED
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "patientId": "uuid",
      "patientName": "João Silva",
      "latitude": -15.7942,
      "longitude": -47.8822,
      "intensity": 9,
      "status": "RED",
      "criticalCount": 3,
      "microArea": "Microárea 01"
    }
  ]
}
```

### GET /v1/territorialization/risk-areas

Retorna áreas de risco identificadas.

**Query Params:**
- `microAreaId` (opcional)

**Response:**
```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "center": {
          "latitude": -15.7942,
          "longitude": -47.8822
        },
        "radius": 1000,
        "riskLevel": "HIGH",
        "patientCount": 15,
        "criticalIndicators": 45
      }
    ],
    "count": 1
  }
}
```

### GET /v1/territorialization/coverage

Retorna estatísticas de cobertura territorial.

**Query Params:**
- `microAreaId` (opcional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 500,
    "patientsWithLocation": 450,
    "coveragePercentage": 90,
    "recentVisits": 120,
    "visitCoveragePercentage": 24,
    "patientsWithoutLocation": 50
  }
}
```

## Requisitos de Dados

Para que o mapa funcione corretamente, os pacientes precisam ter:

1. **Latitude e Longitude cadastradas** na tabela `patients`
2. **Indicadores calculados** nas tabelas:
   - `prenatal_indicators`
   - `childcare_indicators`
   - `diabetes_indicators`
   - `hypertension_indicators`
   - `elderly_indicators`
   - `woman_health_indicators`

## Melhorias Futuras

### Curto Prazo
- [ ] Adicionar geocodificação automática de endereços
- [ ] Implementar desenho de polígonos para delimitar microáreas
- [ ] Adicionar camada de calor (heatmap layer)
- [ ] Exportar mapa como imagem

### Médio Prazo
- [ ] Otimização de rotas para visitas domiciliares
- [ ] Navegação turn-by-turn para ACS
- [ ] Modo offline com cache de tiles
- [ ] Integração com GPS do dispositivo móvel

### Longo Prazo
- [ ] Análise preditiva de áreas de risco
- [ ] Integração com dados demográficos (IBGE)
- [ ] Visualização temporal (evolução ao longo do tempo)
- [ ] Compartilhamento de mapas com gestores

## Troubleshooting

### Marcadores não aparecem
- Verificar se os pacientes têm latitude/longitude cadastradas
- Verificar se os filtros não estão muito restritivos
- Abrir console do navegador para ver erros

### Mapa não carrega
- Verificar conexão com internet (tiles do OpenStreetMap)
- Verificar se o CSS do Leaflet foi importado
- Limpar cache do navegador

### Performance lenta
- Reduzir número de pontos exibidos (usar filtros)
- Implementar clustering para muitos marcadores
- Considerar usar tiles locais em vez de OpenStreetMap

## Suporte

Para dúvidas ou problemas, consulte:
- [Documentação do Leaflet](https://leafletjs.com/)
- [Documentação do React-Leaflet](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
