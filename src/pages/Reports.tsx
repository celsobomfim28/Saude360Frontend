import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Filter, Calendar, Users, Activity, FlaskConical, Syringe, TrendingUp, FileSpreadsheet, Save, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { TeamProductionChart, RiskDistributionChart } from '../components/ReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import { useReportOptions } from '../hooks/useReportOptions';
import IndicatorsReportView from '../components/IndicatorsReportView';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  roles: string[];
  endpoint: string;
  filters?: string[];
}

const reportOptions: ReportOption[] = [
  {
    id: 'micro-area',
    title: 'Relatório da Microárea',
    description: 'Panorama completo de famílias e pessoas sob sua responsabilidade',
    icon: Users,
    roles: ['ACS'],
    endpoint: '/reports/micro-area',
  },
  {
    id: 'home-visits',
    title: 'Visitas Domiciliares',
    description: 'Histórico de visitas realizadas no período',
    icon: Calendar,
    roles: ['ACS'],
    endpoint: '/reports/home-visits',
    filters: ['startDate', 'endDate'],
  },
  {
    id: 'active-search',
    title: 'Busca Ativa',
    description: 'Pacientes com pendências que precisam de atenção',
    icon: Activity,
    roles: ['ACS'],
    endpoint: '/reports/active-search',
    filters: ['microAreaId'],
  },
  {
    id: 'childcare-indicators',
    title: 'Indicadores de Puericultura (C2)',
    description: 'Cuidado no desenvolvimento infantil - crianças até 2 anos',
    icon: Users,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/childcare-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'prenatal-indicators',
    title: 'Indicadores de Pré-Natal (C3)',
    description: 'Cuidado na gestação e puerpério',
    icon: Activity,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/prenatal-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'diabetes-indicators',
    title: 'Indicadores de Diabetes (C4)',
    description: 'Acompanhamento de pessoas com diabetes',
    icon: Activity,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/diabetes-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'hypertension-indicators',
    title: 'Indicadores de Hipertensão (C5)',
    description: 'Acompanhamento de pessoas com hipertensão',
    icon: Activity,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/hypertension-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'elderly-indicators',
    title: 'Indicadores de Idoso (C6)',
    description: 'Cuidado da pessoa idosa',
    icon: Users,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/elderly-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'woman-health-indicators',
    title: 'Indicadores de Saúde da Mulher (C7)',
    description: 'Prevenção do câncer de colo de útero e mama',
    icon: Activity,
    roles: ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
    endpoint: '/reports/woman-health-indicators',
    filters: ['microAreaId'],
  },
  {
    id: 'procedures',
    title: 'Procedimentos Realizados',
    description: 'Antropometria, pressão arterial e vacinas aplicadas',
    icon: Syringe,
    roles: ['TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'ADMIN'],
    endpoint: '/reports/procedures',
    filters: ['professionalId', 'startDate', 'endDate'],
  },
  {
    id: 'pending-exams',
    title: 'Exames Pendentes',
    description: 'Exames aguardando coleta, resultado ou avaliação',
    icon: FlaskConical,
    roles: ['TECNICO_ENFERMAGEM', 'MEDICO', 'ENFERMEIRO', 'ADMIN'],
    endpoint: '/reports/pending-exams',
  },
  {
    id: 'team-production',
    title: 'Produção da Equipe',
    description: 'Consolidação da produção de todos os profissionais',
    icon: TrendingUp,
    roles: ['ENFERMEIRO', 'ADMIN'],
    endpoint: '/reports/team-production',
    filters: ['startDate', 'endDate', 'microAreaId'],
  },
  {
    id: 'chronic-patients',
    title: 'Pacientes Crônicos por Risco',
    description: 'Estratificação de risco de pacientes hipertensos e diabéticos',
    icon: Activity,
    roles: ['MEDICO', 'ENFERMEIRO', 'ADMIN'],
    endpoint: '/reports/chronic-patients',
    filters: ['microAreaId'],
  },
];

export default function Reports() {
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<ReportOption | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  const { savedFilters, saveFilter, removeFilter, loadFilter } = useReportFilters(selectedReport?.id || '');
  const { microAreas, professionals, isLoading: loadingOptions } = useReportOptions();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', selectedReport?.id, filters],
    queryFn: async () => {
      if (!selectedReport) return null;
      const params = new URLSearchParams(filters);
      const response = await api.get(`${selectedReport.endpoint}?${params}`);
      return response.data.data;
    },
    enabled: !!selectedReport && showPreview,
  });

  const availableReports = reportOptions.filter(report =>
    report.roles.includes(user?.role || '')
  );

  const handleGenerateReport = () => {
    setShowPreview(true);
    refetch();
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;
    
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/reports/${selectedReport.id}/pdf?${params.toString()}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      const contentType = response.headers?.['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Resposta não é PDF válido');
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReport.id}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    }
  };

  const handleDownloadXLSX = () => {
    if (!selectedReport || !data) return;

    try {
      let worksheetData: any[] = [];
      let filename = `${selectedReport.id}-${Date.now()}.xlsx`;

      if (selectedReport.id === 'team-production' && data.production) {
        worksheetData = data.production.map((item: any) => ({
          'Profissional': item.professional,
          'Função': item.role,
          'Visitas': item.visits,
          'Antropometria': item.anthropometry,
          'Pressão Arterial': item.bloodPressure,
          'Vacinas': item.vaccines,
          'Total': item.total,
        }));
      } else if (selectedReport.id === 'chronic-patients' && data.patients) {
        worksheetData = data.patients.map((patient: any) => ({
          'Nome': patient.name,
          'Idade': patient.age,
          'Microárea': patient.microArea,
          'Condições': patient.conditions?.join(', '),
          'Nível de Risco': patient.riskLevel,
          'Score de Risco': patient.riskScore,
          'Problemas': patient.issues?.join('; '),
        }));
      } else if (selectedReport.id === 'micro-area' && data.families) {
        data.families.forEach((family: any) => {
          family.members?.forEach((member: any) => {
            worksheetData.push({
              'Endereço': family.address,
              'Nome': member.name,
              'Idade': member.age,
              'Sexo': member.sex === 'MALE' ? 'Masculino' : 'Feminino',
              'CPF': member.cpf,
              'CNS': member.cns,
              'Programas': member.programs?.join(', '),
            });
          });
        });
      } else {
        worksheetData = [data];
      }

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

      const maxWidth = 50;
      const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...worksheetData.map(row => String(row[key] || '').length)
          ),
          maxWidth
        )
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
    }
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    saveFilter(filterName, filters);
    setFilterName('');
    setShowSaveFilterModal(false);
  };

  const handleLoadFilter = (filterId: string) => {
    const loadedFilters = loadFilter(filterId);
    setFilters(loadedFilters);
  };

  const renderFilters = () => {
    if (!selectedReport?.filters) return null;

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {selectedReport.filters.includes('startDate') && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Data Início
              </label>
              <input
                type="date"
                className="input"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
          )}
          {selectedReport.filters.includes('endDate') && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Data Fim
              </label>
              <input
                type="date"
                className="input"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          )}
          {selectedReport.filters.includes('microAreaId') && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Microárea
              </label>
              <select
                className="input"
                value={filters.microAreaId || ''}
                onChange={(e) => setFilters({ ...filters, microAreaId: e.target.value })}
                disabled={loadingOptions}
              >
                <option value="">Todas</option>
                {microAreas.map((ma) => (
                  <option key={ma.id} value={ma.id}>
                    {ma.name} ({ma.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedReport.filters.includes('professionalId') && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Profissional
              </label>
              <select
                className="input"
                value={filters.professionalId || ''}
                onChange={(e) => setFilters({ ...filters, professionalId: e.target.value })}
                disabled={loadingOptions}
              >
                <option value="">Todos</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.fullName} ({prof.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {savedFilters.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Filtros Salvos:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {savedFilters.map((filter) => (
                <div key={filter.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '0.5rem'
                }}>
                  <button
                    onClick={() => handleLoadFilter(filter.id)}
                    style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--primary)',
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Star size={14} style={{ marginRight: '0.25rem' }} />
                    {filter.name}
                  </button>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    style={{ 
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportData = () => {
    if (!data) return null;

    // Relatórios de Indicadores
    const indicatorReports = [
      'childcare-indicators',
      'prenatal-indicators',
      'diabetes-indicators',
      'hypertension-indicators',
      'elderly-indicators',
      'woman-health-indicators',
    ];

    if (selectedReport && indicatorReports.includes(selectedReport.id)) {
      return <IndicatorsReportView data={data} reportType={selectedReport.id} />;
    }

    if (selectedReport?.id === 'micro-area') {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Resumo da Microárea
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Total de Famílias
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {data.totalFamilies}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Total de Pacientes
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {data.totalPatients}
                </p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Famílias
          </h3>
          {data.families?.map((family: any, index: number) => (
            <div key={index} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                {family.address} - {family.totalMembers} membro(s)
              </h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {family.members?.map((member: any, mIndex: number) => (
                  <div key={mIndex} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'var(--background)',
                    borderRadius: '0.5rem'
                  }}>
                    <div>
                      <p style={{ fontWeight: '500' }}>{member.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {member.age} anos • {member.sex === 'MALE' ? 'Masculino' : 'Feminino'}
                      </p>
                    </div>
                    {member.programs?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {member.programs.map((program: string, pIndex: number) => (
                          <span key={pIndex} style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {program}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedReport?.id === 'team-production') {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Totais do Período
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Visitas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                  {data.totals?.visits || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Antropometria
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {data.totals?.anthropometry || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Pressão Arterial
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {data.totals?.bloodPressure || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Vacinas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {data.totals?.vaccines || 0}
                </p>
              </div>
            </div>
          </div>

          {data.production && data.production.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <TeamProductionChart data={data.production} />
            </div>
          )}

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Detalhamento por Profissional
          </h3>
          <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Profissional</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Função</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Visitas</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Antropometria</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>PA</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Vacinas</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.production?.map((item: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{item.professional}</td>
                    <td style={{ padding: '0.75rem' }}>{item.role}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.visits}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.anthropometry}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.bloodPressure}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.vaccines}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (selectedReport?.id === 'home-visits') {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Resumo de Visitas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Total de Visitas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {data.totalVisits || 0}
                </p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Histórico de Visitas
          </h3>

          {data.visits?.length > 0 ? (
            <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Data</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Paciente</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Endereço</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Finalidade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.visits.map((visit: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {visit.date ? new Date(visit.date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{visit.patient || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{visit.address || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{visit.type || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{visit.purpose || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma visita encontrada para o período selecionado.</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedReport?.id === 'active-search') {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Resumo da Busca Ativa
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Pacientes com Pendências
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {data.totalPatients || 0}
                </p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Lista de Pacientes
          </h3>

          {data.patients?.length > 0 ? (
            data.patients.map((patient: any, index: number) => (
              <div key={index} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {patient.name}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {patient.address || '-'}
                  </p>
                  {patient.phone && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Telefone: {patient.phone}
                    </p>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Pendências
                  </p>
                  {patient.pendencies?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {patient.pendencies.map((pendency: string, pIndex: number) => (
                        <li key={pIndex} style={{ marginBottom: '0.25rem', color: '#ef4444', fontSize: '0.875rem' }}>
                          {pendency}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem pendências registradas.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhum paciente com pendências encontrado.</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedReport?.id === 'chronic-patients') {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Resumo
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Total de Pacientes
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {data.total || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Alto Risco
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {data.byRisk?.high || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Médio Risco
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {data.byRisk?.medium || 0}
                </p>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Baixo Risco
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {data.byRisk?.low || 0}
                </p>
              </div>
            </div>
          </div>

          {data.byRisk && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <RiskDistributionChart data={data.byRisk} />
            </div>
          )}

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Pacientes por Risco
          </h3>
          {data.patients?.map((patient: any, index: number) => (
            <div key={index} className="card" style={{ 
              padding: '1.5rem', 
              marginBottom: '1rem',
              borderLeft: `4px solid ${
                patient.riskLevel === 'ALTO' ? '#ef4444' : 
                patient.riskLevel === 'MÉDIO' ? '#f59e0b' : '#10b981'
              }`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {patient.name}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {patient.age} anos • {patient.microArea}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: patient.riskLevel === 'ALTO' ? '#ef4444' : 
                                   patient.riskLevel === 'MÉDIO' ? '#f59e0b' : '#10b981',
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {patient.riskLevel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {patient.conditions?.map((condition: string, cIndex: number) => (
                  <span key={cIndex} style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {condition}
                  </span>
                ))}
              </div>
              {patient.issues && patient.issues.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Problemas Identificados:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {patient.issues.map((issue: string, iIndex: number) => (
                      <li key={iIndex} style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '0.25rem' }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.5rem' }}>
          Relatórios
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Gere relatórios detalhados para análise e acompanhamento
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '300px 1fr' : '1fr', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Relatórios Disponíveis
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {availableReports.map((report) => {
              const Icon = report.icon;
              return (
                <motion.button
                  key={report.id}
                  className={`card ${selectedReport?.id === report.id ? 'selected' : ''}`}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: selectedReport?.id === report.id ? '2px solid var(--primary)' : 'none',
                    backgroundColor: selectedReport?.id === report.id ? 'var(--primary-light)' : 'white',
                  }}
                  onClick={() => {
                    setSelectedReport(report);
                    setShowPreview(false);
                    setFilters({});
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {report.title}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {report.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {selectedReport && (
          <div>
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <FileText size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {selectedReport.title}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              {renderFilters()}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Filter size={16} />
                  {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                {showPreview && data && (
                  <>
                    <button
                      className="btn"
                      onClick={handleDownloadPDF}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} />
                      Baixar PDF
                    </button>
                    <button
                      className="btn"
                      onClick={handleDownloadXLSX}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <FileSpreadsheet size={16} />
                      Exportar Excel
                    </button>
                  </>
                )}
                {selectedReport.filters && Object.keys(filters).length > 0 && (
                  <button
                    className="btn"
                    onClick={() => setShowSaveFilterModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Save size={16} />
                    Salvar Filtros
                  </button>
                )}
              </div>
            </div>

            {isLoading && <LoadingSpinner fullScreen={false} message="Gerando relatório..." />}
            {showPreview && data && !isLoading && renderReportData()}
          </div>
        )}
      </div>

      {showSaveFilterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ padding: '2rem', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Salvar Filtros
            </h3>
            <input
              type="text"
              className="input"
              placeholder="Nome do filtro"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => {
                  setShowSaveFilterModal(false);
                  setFilterName('');
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
