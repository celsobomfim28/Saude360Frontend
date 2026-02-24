import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function PredictiveAnalytics() {
  const [viewMode, setViewMode] = useState<'predictions' | 'risks' | 'trends'>('predictions');
  const [selectedIndicator, setSelectedIndicator] = useState('prenatal');

  // Buscar predições de faltas
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const response = await api.get('/predictive/absence-predictions');
      return response.data.data;
    },
    enabled: viewMode === 'predictions',
  });

  // Buscar pacientes de risco
  const { data: riskPatients, isLoading: loadingRisks } = useQuery({
    queryKey: ['risk-patients'],
    queryFn: async () => {
      const response = await api.get('/predictive/risk-patients');
      return response.data.data;
    },
    enabled: viewMode === 'risks',
  });

  // Buscar tendências
  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['trends', selectedIndicator],
    queryFn: async () => {
      const response = await api.post('/predictive/indicator-trends', {
        indicator: selectedIndicator,
        months: 6,
      });
      return response.data.data;
    },
    enabled: viewMode === 'trends',
  });

  const indicators = [
    { value: 'prenatal', label: 'Pré-Natal' },
    { value: 'childcare', label: 'Puericultura' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hipertensão' },
    { value: 'elderly', label: 'Idoso' },
  ];

  const isLoading = loadingPredictions || loadingRisks || loadingTrends;

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Processando análises preditivas..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Análise Preditiva
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Inteligência artificial para prevenção e planejamento
          </p>
        </div>
        <div className="actions-wrap">
          <button
            onClick={() => setViewMode('predictions')}
            className={viewMode === 'predictions' ? 'btn btn-primary' : 'btn'}
          >
            Predições
          </button>
          <button
            onClick={() => setViewMode('risks')}
            className={viewMode === 'risks' ? 'btn btn-primary' : 'btn'}
          >
            Pacientes de Risco
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={viewMode === 'trends' ? 'btn btn-primary' : 'btn'}
          >
            Tendências
          </button>
        </div>
      </header>

      {/* Predições de Faltas */}
      {viewMode === 'predictions' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Predição de Faltas em Consultas</h3>
          {predictions && predictions.length > 0 ? (
            <>
              <div className="desktop-only table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paciente</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Consulta</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Probabilidade</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fatores de Risco</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ação Sugerida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred: any) => (
                      <tr key={pred.appointmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{pred.patientName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Microárea: {pred.microArea}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          {new Date(pred.appointmentDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '100px',
                              height: '8px',
                              backgroundColor: 'var(--background)',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${pred.absenceProbability}%`,
                                height: '100%',
                                backgroundColor: pred.absenceProbability > 70 ? 'var(--status-red)' : pred.absenceProbability > 40 ? 'var(--status-yellow)' : 'var(--status-green)'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pred.absenceProbability}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {pred.riskFactors.join(', ')}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          {pred.suggestedAction}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-card-list">
                {predictions.map((pred: any) => (
                  <div className="mobile-card" key={`mobile-${pred.appointmentId}`}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{pred.patientName}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Microárea: {pred.microArea}</p>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Consulta</span>
                      <span>{new Date(pred.appointmentDate).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Probabilidade</span>
                      <span style={{ fontWeight: 700 }}>{pred.absenceProbability}%</span>
                    </div>

                    <div style={{ marginTop: '0.5rem', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pred.absenceProbability}%`,
                          height: '100%',
                          backgroundColor: pred.absenceProbability > 70 ? 'var(--status-red)' : pred.absenceProbability > 40 ? 'var(--status-yellow)' : 'var(--status-green)'
                        }}
                      />
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Fatores</span>
                      <span style={{ textAlign: 'right' }}>{pred.riskFactors.join(', ')}</span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Ação</span>
                      <span style={{ textAlign: 'right' }}>{pred.suggestedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Brain}
              title="Nenhuma predição disponível"
              description="Não há consultas agendadas para análise preditiva no momento."
            />
          )}
        </motion.div>
      )}

      {/* Pacientes de Risco */}
      {viewMode === 'risks' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Pacientes de Alto Risco</h3>
          {riskPatients && riskPatients.length > 0 ? (
            <div className="responsive-cards-grid">
              {riskPatients.map((patient: any) => (
                <div key={patient.patientId} style={{ 
                  padding: '1.25rem', 
                  border: `2px solid ${patient.riskLevel === 'HIGH' ? 'var(--status-red)' : patient.riskLevel === 'MEDIUM' ? 'var(--status-yellow)' : 'var(--status-green)'}`,
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <AlertTriangle size={20} color={patient.riskLevel === 'HIGH' ? 'var(--status-red)' : 'var(--status-yellow)'} />
                    <h4 style={{ margin: 0 }}>{patient.patientName}</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nível de Risco:</span>
                      <span style={{ fontWeight: 600 }}>
                        {patient.riskLevel === 'HIGH' ? 'Alto' : patient.riskLevel === 'MEDIUM' ? 'Médio' : 'Baixo'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Score:</span>
                      <span style={{ fontWeight: 600 }}>{patient.riskScore}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fatores de Risco:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {patient.riskFactors.map((factor: string, idx: number) => (
                        <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'white', borderRadius: '12px' }}>
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1e40af' }}>Ações Recomendadas:</p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#1e40af' }}>
                      {patient.recommendedActions.map((action: string, idx: number) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum paciente de alto risco"
              description="Não há pacientes identificados como alto risco no momento."
            />
          )}
        </motion.div>
      )}

      {/* Tendências */}
      {viewMode === 'trends' && (
        <>
          <div className="card glass filter-bar">
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="filter-control"
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
            >
              {indicators.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          {trends && (
            <div className="responsive-cards-grid">
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 style={{ marginBottom: '1.5rem' }}>Tendência de Indicadores</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.historical}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="green" stroke="var(--status-green)" name="Verde" strokeWidth={2} />
                    <Line type="monotone" dataKey="yellow" stroke="var(--status-yellow)" name="Amarelo" strokeWidth={2} />
                    <Line type="monotone" dataKey="red" stroke="var(--status-red)" name="Vermelho" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 style={{ marginBottom: '1.5rem' }}>Projeção (3 meses)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.forecast}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="green" fill="var(--status-green)" name="Verde" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="yellow" fill="var(--status-yellow)" name="Amarelo" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="red" fill="var(--status-red)" name="Vermelho" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
