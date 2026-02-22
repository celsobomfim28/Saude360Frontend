import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Map, MapPin, AlertTriangle, TrendingUp, Users, Navigation } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import InteractiveMap from '../components/InteractiveMap';
import { useAuthStore } from '../stores/authStore';

export default function Territorialization() {
  const user = useAuthStore((state) => state.user);
  const isACS = user?.role === 'ACS';
  const acsMicroAreaId = user?.microArea?.id || '';

  const [selectedMicroArea, setSelectedMicroArea] = useState<string>('');
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [viewMode, setViewMode] = useState<'heatmap' | 'risk' | 'coverage'>('heatmap');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // ACS sempre opera na própria microárea
  useEffect(() => {
    if (isACS && acsMicroAreaId) {
      setSelectedMicroArea(acsMicroAreaId);
    }
  }, [isACS, acsMicroAreaId]);

  // Buscar microáreas
  const { data: microAreas } = useQuery({
    queryKey: ['micro-areas'],
    queryFn: async () => {
      const response = await api.get('/management/micro-areas');
      return response.data.data;
    },
  });

  // Buscar estatísticas de geocodificação
  const { data: geocodingStats, refetch: refetchStats } = useQuery({
    queryKey: ['geocoding-stats'],
    queryFn: async () => {
      const response = await api.get('/geocoding/stats');
      return response.data.data;
    },
  });

  // Buscar mapa de calor
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['heatmap', selectedMicroArea, selectedIndicator],
    queryFn: async () => {
      const response = await api.post('/territorialization/heatmap', {
        microAreaId: selectedMicroArea || undefined,
        indicator: selectedIndicator || undefined,
        status: 'RED',
      });
      return response.data.data;
    },
    enabled: viewMode === 'heatmap',
  });

  // Buscar cobertura territorial
  const { data: coverage, isLoading: loadingCoverage } = useQuery({
    queryKey: ['coverage', selectedMicroArea],
    queryFn: async () => {
      const params = selectedMicroArea ? `?microAreaId=${selectedMicroArea}` : '';
      const response = await api.get(`/territorialization/coverage${params}`);
      return response.data.data;
    },
    enabled: viewMode === 'coverage',
  });

  // Buscar áreas de risco
  const { data: riskAreasData, isLoading: loadingRisk } = useQuery({
    queryKey: ['risk-areas', selectedMicroArea],
    queryFn: async () => {
      const params = selectedMicroArea ? `?microAreaId=${selectedMicroArea}` : '';
      const response = await api.get(`/territorialization/risk-areas${params}`);
      return response.data.data;
    },
    enabled: viewMode === 'risk',
  });

  const riskAreas = riskAreasData?.areas || riskAreasData;

  const indicators = [
    { value: '', label: 'Todos os Indicadores' },
    { value: 'B1', label: 'B1 - 1ª Consulta RN' },
    { value: 'B4', label: 'B4 - Visitas RN' },
    { value: 'C1', label: 'C1 - Consultas Pré-Natal' },
    { value: 'C4', label: 'C4 - Visitas Gestante' },
    { value: 'D4', label: 'D4 - Visitas Diabetes' },
    { value: 'E4', label: 'E4 - Visitas Hipertensão' },
  ];

  const isLoading = loadingHeatmap || loadingRisk || loadingCoverage;

  // Função para geocodificar pacientes
  const handleGeocode = async () => {
    if (isGeocoding) return;

    const confirmed = window.confirm(
      `Deseja geocodificar os ${geocodingStats?.pending || 0} pacientes pendentes?\n\n` +
      'Este processo pode levar alguns minutos e usa a API gratuita do OpenStreetMap.\n' +
      'Limite: 10 pacientes por vez para não sobrecarregar o serviço.'
    );

    if (!confirmed) return;

    setIsGeocoding(true);
    try {
      const response = await api.post('/geocoding/batch', {
        limit: 10,
        microAreaId: selectedMicroArea || undefined,
      });

      alert(response.data.message);
      refetchStats();
    } catch (error: any) {
      alert('Erro ao geocodificar: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleResetGeocoding = async () => {
    if (isGeocoding) return;

    const confirmed = window.confirm(
      'Deseja resetar a geocodificação dos pacientes?\n\n' +
      'Isso irá limpar latitude/longitude dos pacientes selecionados (ou da sua microárea, no caso de ACS).\n' +
      'Depois será necessário geocodificar novamente.'
    );

    if (!confirmed) return;

    setIsGeocoding(true);
    try {
      const response = await api.post('/geocoding/reset', {
        microAreaId: selectedMicroArea || undefined,
      });

      alert(response.data.message || 'Reset de geocodificação concluído.');
      refetchStats();
    } catch (error: any) {
      alert('Erro ao resetar geocodificação: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setIsGeocoding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando dados territoriais..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Territorialização
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Visualização geográfica de indicadores e otimização de rotas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setViewMode('heatmap')}
            className={viewMode === 'heatmap' ? 'btn btn-primary' : 'btn'}
          >
            Mapa de Calor
          </button>
          <button
            onClick={() => setViewMode('risk')}
            className={viewMode === 'risk' ? 'btn btn-primary' : 'btn'}
          >
            Áreas de Risco
          </button>
          <button
            onClick={() => setViewMode('coverage')}
            className={viewMode === 'coverage' ? 'btn btn-primary' : 'btn'}
          >
            Cobertura
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedMicroArea}
            onChange={(e) => setSelectedMicroArea(e.target.value)}
            disabled={isACS}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minWidth: '200px' }}
          >
            {isACS ? (
              <>
                <option value={acsMicroAreaId}>
                  {user?.microArea?.name || 'Minha microárea'}
                </option>
              </>
            ) : (
              <>
                <option value="">Todas as Microáreas</option>
                {microAreas?.map((ma: any) => (
                  <option key={ma.id} value={ma.id}>
                    {ma.name}
                  </option>
                ))}
              </>
            )}
          </select>

          {viewMode === 'heatmap' && (
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minWidth: '200px' }}
            >
              {indicators.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Botão de Geocodificação */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {geocodingStats && geocodingStats.pending > 0 && (
            <button
              onClick={handleGeocode}
              disabled={isGeocoding}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Navigation size={16} />
              {isGeocoding ? 'Geocodificando...' : `Geocodificar ${geocodingStats.pending} pacientes`}
            </button>
          )}

          <button
            onClick={handleResetGeocoding}
            disabled={isGeocoding}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Resetar geocodificação
          </button>
        </div>

        {geocodingStats && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {geocodingStats.geocoded} de {geocodingStats.total} pacientes geocodificados ({geocodingStats.percentage}%)
          </div>
        )}
      </div>

      {/* Mapa de Calor */}
      {viewMode === 'heatmap' && (
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Mapa de Calor de Indicadores</h3>
            <InteractiveMap
              points={
                heatmapData?.map((point: any) => ({
                  id: point.patientId,
                  lat: point.latitude || -10.3193,
                  lng: point.longitude || -36.9936,
                  patientName: point.patientName,
                  status: point.status || 'RED',
                  criticalCount: point.criticalCount,
                  microArea: point.microArea,
                })) || []
              }
              height="500px"
              onMarkerClick={(point) => {
                console.log('Marcador clicado:', point);
              }}
            />
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Pontos Críticos</h3>
            {heatmapData && heatmapData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {heatmapData.slice(0, 10).map((point: any, idx: number) => (
                  <div key={idx} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <MapPin size={16} color="var(--status-red)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{point.patientName}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Microárea: {point.microArea} • {point.criticalCount} indicadores críticos
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MapPin}
                title="Nenhum ponto crítico"
                description="Não há pontos críticos identificados no momento."
              />
            )}
          </motion.div>
        </div>
      )}

      {/* Áreas de Risco */}
      {viewMode === 'risk' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Áreas de Risco Identificadas</h3>
          {riskAreas && riskAreas.length > 0 ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {riskAreas.map((area: any, idx: number) => (
                <div key={idx} style={{ 
                  padding: '1.25rem', 
                  border: `2px solid ${area.riskLevel === 'HIGH' ? 'var(--status-red)' : area.riskLevel === 'MEDIUM' ? 'var(--status-yellow)' : 'var(--status-green)'}`,
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <AlertTriangle size={20} color={area.riskLevel === 'HIGH' ? 'var(--status-red)' : area.riskLevel === 'MEDIUM' ? 'var(--status-yellow)' : 'var(--status-green)'} />
                    <h4 style={{ margin: 0 }}>Área {idx + 1}</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nível de Risco:</span>
                      <span style={{ fontWeight: 600 }}>
                        {area.riskLevel === 'HIGH' ? 'Alto' : area.riskLevel === 'MEDIUM' ? 'Médio' : 'Baixo'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Pacientes:</span>
                      <span style={{ fontWeight: 600 }}>{area.patientCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Indicadores Críticos:</span>
                      <span style={{ fontWeight: 600 }}>{area.criticalIndicators}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="Nenhuma área de risco"
              description="Não há áreas de risco identificadas no momento."
            />
          )}
        </motion.div>
      )}

      {/* Cobertura Territorial */}
      {viewMode === 'coverage' && coverage && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ borderLeft: '4px solid var(--primary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Pacientes com Localização
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  {coverage.patientsWithLocation}
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--primary)15', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                <MapPin size={24} color="var(--primary)" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ borderLeft: '4px solid var(--accent)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Taxa de Cobertura
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  {coverage.coveragePercentage}%
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--accent)15', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                <TrendingUp size={24} color="var(--accent)" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ borderLeft: '4px solid var(--success)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Visitas (30 dias)
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  {coverage.recentVisits}
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--success)15', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                <Users size={24} color="var(--success)" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ borderLeft: '4px solid var(--status-red)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Sem Localização
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  {coverage.patientsWithoutLocation}
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--status-red)15', padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                <AlertTriangle size={24} color="var(--status-red)" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
