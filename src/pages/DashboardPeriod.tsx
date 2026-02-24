import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ViewType = 'stats' | 'evolution';

const periodLabels: Record<PeriodType, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

const indicatorLabels: Record<string, string> = {
  prenatal: 'Pré-Natal',
  childcare: 'Puericultura',
  diabetes: 'Diabetes',
  hypertension: 'Hipertensão',
  elderly: 'Idoso',
  woman: 'Saúde da Mulher',
};

export default function DashboardPeriod() {
  const [viewType, setViewType] = useState<ViewType>('stats');
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [indicator, setIndicator] = useState('prenatal');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const extractErrorMessage = (error: any) =>
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    'Não foi possível carregar os dados para esse período. Tente outro filtro ou ajuste o intervalo de datas.';

  const toApiStartDate = (date: string) => `${date}T00:00:00.000Z`;
  const toApiEndDate = (date: string) => `${date}T23:59:59.000Z`;

  // Query para estatísticas por período
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', period, dateRange],
    queryFn: async () => {
      const response = await api.post('/dashboard/stats-by-period', {
        startDate: toApiStartDate(dateRange.startDate),
        endDate: toApiEndDate(dateRange.endDate),
        period,
      });

      return response.data;
    },
    enabled: viewType === 'stats',
    retry: false,
  });

  // Query para evolução de indicadores
  const { data: evolutionData, isLoading: evolutionLoading } = useQuery({
    queryKey: ['dashboard-evolution', indicator, dateRange],
    queryFn: async () => {
      const response = await api.post('/dashboard/indicator-evolution', {
        startDate: toApiStartDate(dateRange.startDate),
        endDate: toApiEndDate(dateRange.endDate),
        indicator,
      });
      return response.data;
    },
    enabled: viewType === 'evolution',
    retry: false,
  });

  const isLoading = statsLoading || evolutionLoading;

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando dados..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Dashboard por Período
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Análise temporal de estatísticas e indicadores
          </p>
        </div>
        <div className="actions-wrap">
          <button
            onClick={() => setViewType('stats')}
            className={viewType === 'stats' ? 'btn btn-primary' : 'btn'}
          >
            Estatísticas
          </button>
          <button
            onClick={() => setViewType('evolution')}
            className={viewType === 'evolution' ? 'btn btn-primary' : 'btn'}
          >
            Evolução
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="card glass filter-bar">
        {viewType === 'stats' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="filter-control"
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
          >
            {Object.entries(periodLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}

        {viewType === 'evolution' && (
          <select
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            className="filter-control"
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
          >
            {Object.entries(indicatorLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          className="filter-control"
          style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
        />

        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          className="filter-control"
          style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
        />
      </div>

      {/* Estatísticas por Período */}
      {viewType === 'stats' && statsError && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            borderLeft: '4px solid var(--danger)',
            backgroundColor: '#fee2e2',
            color: '#991b1b'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Erro ao carregar estatísticas por período</h3>
          <p style={{ marginBottom: 0 }}>{extractErrorMessage(statsError)}</p>
        </div>
      )}

      {viewType === 'stats' && statsData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cards de Resumo */}
          {statsData.length > 0 && (() => {
            const totals = statsData.reduce((acc: any, item: any) => ({
              newPatients: acc.newPatients + item.newPatients,
              appointments: acc.appointments + item.appointments,
              homeVisits: acc.homeVisits + item.homeVisits,
              vaccineApplications: acc.vaccineApplications + item.vaccineApplications,
              evaluatedExams: acc.evaluatedExams + item.evaluatedExams,
            }), { newPatients: 0, appointments: 0, homeVisits: 0, vaccineApplications: 0, evaluatedExams: 0 });

            return (
              <div className="indicator-cards-grid">
                <StatCard icon={Users} label="Novos Pacientes" value={totals.newPatients} color="var(--primary)" />
                <StatCard icon={Calendar} label="Consultas" value={totals.appointments} color="var(--accent)" />
                <StatCard icon={Activity} label="Visitas" value={totals.homeVisits} color="var(--success)" />
                <StatCard icon={Activity} label="Vacinas" value={totals.vaccineApplications} color="#8b5cf6" />
                <StatCard icon={BarChart3} label="Exames" value={totals.evaluatedExams} color="#0284c7" />
              </div>
            );
          })()}

          {/* Gráfico de Linha */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Evolução de Estatísticas</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="var(--accent)" name="Consultas" strokeWidth={2} />
                <Line type="monotone" dataKey="homeVisits" stroke="var(--success)" name="Visitas" strokeWidth={2} />
                <Line type="monotone" dataKey="vaccineApplications" stroke="#8b5cf6" name="Vacinas" strokeWidth={2} />
                <Line type="monotone" dataKey="evaluatedExams" stroke="#0284c7" name="Exames" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gráfico de Barras */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Comparação por Período</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="appointments" fill="var(--accent)" name="Consultas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="homeVisits" fill="var(--success)" name="Visitas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vaccineApplications" fill="#8b5cf6" name="Vacinas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evaluatedExams" fill="#0284c7" name="Exames" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Evolução de Indicadores */}
      {viewType === 'evolution' && evolutionData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cards de Resumo */}
          {evolutionData.length > 0 && (() => {
            const latest = evolutionData[evolutionData.length - 1];
            return (
              <div className="indicator-cards-grid">
                <StatCard icon={TrendingUp} label="Verde" value={latest.green} color="var(--status-green)" percentage={latest.greenPercentage} />
                <StatCard icon={Activity} label="Amarelo" value={latest.yellow} color="var(--status-yellow)" />
                <StatCard icon={Activity} label="Vermelho" value={latest.red} color="var(--status-red)" />
                <StatCard icon={Users} label="Total" value={latest.total} color="var(--primary)" />
              </div>
            );
          })()}

          {/* Gráfico de Área Empilhada */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Evolução de {indicatorLabels[indicator]}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Area type="monotone" dataKey="green" stackId="1" stroke="var(--status-green)" fill="var(--status-green)" name="Verde" />
                <Area type="monotone" dataKey="yellow" stackId="1" stroke="var(--status-yellow)" fill="var(--status-yellow)" name="Amarelo" />
                <Area type="monotone" dataKey="red" stackId="1" stroke="var(--status-red)" fill="var(--status-red)" name="Vermelho" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gráfico de Percentual Verde */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Percentual de Status Verde</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number | undefined) => `${(value ?? 0).toFixed(1)}%`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="greenPercentage" 
                  stroke="var(--status-green)" 
                  name="% Verde" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  percentage 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
  percentage?: number;
}) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            {new Intl.NumberFormat('pt-BR').format(value)}
          </p>
          {percentage !== undefined && (
            <p style={{ fontSize: '0.875rem', color, fontWeight: 600, marginTop: '0.25rem' }}>
              {percentage.toFixed(1)}%
            </p>
          )}
        </div>
        <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}
