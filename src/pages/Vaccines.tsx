import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Syringe, Plus, Calendar, User, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface Vaccine {
  id: string;
  name: string;
  description: string;
  ageGroup: string;
  doses: number;
  observations: string;
}

export function Vaccines() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedVaccineId, setSelectedVaccineId] = useState<string>('');
  const [dose, setDose] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 16));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Buscar catálogo de vacinas
  const { data: vaccines, isLoading: loadingVaccines } = useQuery({
    queryKey: ['vaccines'],
    queryFn: async () => {
      try {
        const response = await api.get('/vaccines');
        return response.data as Vaccine[];
      } catch (error) {
        console.error('Erro ao buscar vacinas:', error);
        return [];
      }
    }
  });

  // Buscar pacientes
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchTerm, selectedGroup, user?.role, user?.microArea?.id],
    queryFn: async () => {
      try {
        const params: any = {
          limit: 50
        };

        // Filtrar por grupo de elegibilidade
        if (selectedGroup !== 'ALL') {
          params.eligibilityGroup = selectedGroup;
        }

        // Se for ACS, filtrar por microárea
        if (user?.role === 'ACS' && user?.microArea?.id) {
          params.microAreaId = user.microArea.id;
        }

        // Se há busca, adicionar filtro de nome
        if (searchTerm && searchTerm.length >= 3) {
          params.name = searchTerm;
        }

        const response = await api.get('/patients', { params });
        return response.data.data || [];
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        return [];
      }
    }
  });

  // Buscar calendário vacinal do paciente
  const { data: schedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['vaccine-schedule', selectedPatientId],
    queryFn: async () => {
      try {
        const response = await api.get(`/vaccines/schedule/${selectedPatientId}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar calendário vacinal:', error);
        return null;
      }
    },
    enabled: !!selectedPatientId && showScheduleModal
  });

  // Buscar vacinas pendentes
  const { data: pending } = useQuery({
    queryKey: ['vaccine-pending', selectedPatientId],
    queryFn: async () => {
      try {
        const response = await api.get(`/vaccines/pending/${selectedPatientId}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar vacinas pendentes:', error);
        return null;
      }
    },
    enabled: !!selectedPatientId && showScheduleModal
  });

  // Registrar aplicação
  const applyVaccineMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/vaccines/apply', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccine-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['vaccine-pending'] });
      setShowApplicationModal(false);
      setSelectedVaccineId('');
      setDose(1);
      setBatchNumber('');
      alert('Vacina aplicada com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao aplicar vacina');
    }
  });

  const handleApplyVaccine = () => {
    if (!selectedPatientId || !selectedVaccineId) {
      alert('Selecione um paciente e uma vacina');
      return;
    }

    applyVaccineMutation.mutate({
      patientId: selectedPatientId,
      vaccineId: selectedVaccineId,
      applicationDate: new Date(applicationDate).toISOString(),
      dose,
      batchNumber: batchNumber || undefined
    });
  };

  const handleOpenSchedule = (patient: any) => {
    setSelectedPatient(patient);
    setSelectedPatientId(patient.id);
    setShowScheduleModal(true);
  };

  const handleCloseSchedule = () => {
    setShowScheduleModal(false);
    setSelectedPatientId('');
    setSelectedPatient(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      COMPLETE: { bg: '#dcfce7', color: '#166534', label: 'Completo' },
      IN_PROGRESS: { bg: '#fef3c7', color: '#92400e', label: 'Em Andamento' },
      PENDING: { bg: '#fee2e2', color: '#991b1b', label: 'Pendente' }
    };
    const config = styles[status] || styles.PENDING;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '12px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        {config.label}
      </span>
    );
  };

  if (loadingVaccines) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando vacinas..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Calendário Vacinal
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {user?.role === 'ACS' 
              ? `Pacientes da sua microárea (${user?.microArea?.name || 'Área não definida'})`
              : 'Gerencie o calendário vacinal de todos os grupos'
            }
          </p>
        </div>
      </header>

      {/* Filtros por Grupo */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por grupo:</span>
          {[
            { value: 'ALL', label: 'Todos', icon: '👥' },
            { value: 'CHILD', label: 'Crianças', icon: '👶' },
            { value: 'PREGNANT', label: 'Gestantes', icon: '🤰' },
            { value: 'ELDERLY', label: 'Idosos', icon: '👴' },
            { value: 'WOMAN', label: 'Mulheres', icon: '👩' },
          ].map((group) => (
            <button
              key={group.value}
              onClick={() => setSelectedGroup(group.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: selectedGroup === group.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: selectedGroup === group.value ? 'var(--primary)15' : 'white',
                color: selectedGroup === group.value ? 'var(--primary)' : 'var(--text)',
                fontWeight: selectedGroup === group.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{group.icon}</span>
              {group.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>
            {selectedGroup === 'ALL' && 'Todos os Pacientes'}
            {selectedGroup === 'CHILD' && 'Crianças Cadastradas'}
            {selectedGroup === 'PREGNANT' && 'Gestantes Cadastradas'}
            {selectedGroup === 'ELDERLY' && 'Idosos Cadastrados'}
            {selectedGroup === 'WOMAN' && 'Mulheres Cadastradas'}
          </h3>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {loadingPatients ? (
          <LoadingSpinner message="Carregando pacientes..." />
        ) : patients && patients.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {patients.map((patient: any) => (
              <motion.button
                key={patient.id}
                onClick={() => handleOpenSchedule(patient)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  textAlign: 'left',
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={24} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {patient.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {patient.age} {patient.age === 1 ? 'ano' : 'anos'}
                      {patient.eligibilityGroups && patient.eligibilityGroups.length > 0 && (
                        <span style={{ marginLeft: '8px' }}>
                          • {patient.eligibilityGroups.map((g: string) => {
                            const labels: any = { CHILD: 'Criança', PREGNANT: 'Gestante', ELDERLY: 'Idoso', WOMAN: 'Mulher' };
                            return labels[g] || g;
                          }).join(', ')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>Ver calendário vacinal</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={User}
            title="Nenhum paciente encontrado"
            description={searchTerm ? "Tente buscar com outro termo" : `Não há ${selectedGroup === 'ALL' ? 'pacientes' : selectedGroup === 'CHILD' ? 'crianças' : selectedGroup === 'PREGNANT' ? 'gestantes' : selectedGroup === 'ELDERLY' ? 'idosos' : 'mulheres'} cadastrados no sistema`}
          />
        )}
      </div>

      {/* Modal do Calendário Vacinal */}
      {showScheduleModal && selectedPatient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}
        onClick={handleCloseSchedule}
        >
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>Calendário Vacinal</h2>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {selectedPatient.fullName}
                </p>
                {schedule && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {(() => {
                      const ageInMonths = schedule.patient.ageInMonths;
                      
                      // Validar se ageInMonths é um número válido
                      if (typeof ageInMonths !== 'number' || isNaN(ageInMonths)) {
                        return 'Idade não disponível';
                      }
                      
                      const ageInYears = Math.floor(ageInMonths / 12);
                      const remainingMonths = ageInMonths % 12;
                      
                      if (ageInYears < 1) {
                        return `Idade: ${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`;
                      } else if (remainingMonths === 0) {
                        return `Idade: ${ageInYears} ${ageInYears === 1 ? 'ano' : 'anos'}`;
                      } else {
                        return `Idade: ${ageInYears} ${ageInYears === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
                      }
                    })()}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} />
                  Registrar Aplicação
                </button>
                <button
                  onClick={handleCloseSchedule}
                  className="btn"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Fechar
                </button>
              </div>
            </div>

            {loadingSchedule ? (
              <LoadingSpinner message="Carregando calendário..." />
            ) : schedule && schedule.schedule.length > 0 ? (
              <>
                {/* Resumo de Vacinas Pendentes */}
                {pending && pending.summary && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#991b1b', margin: '0 0 0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Pendentes</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>{pending.summary.totalPending}</p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#92400e', margin: '0 0 0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Em Andamento</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#92400e', margin: 0 }}>{pending.summary.totalInProgress}</p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#fed7aa', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#9a3412', margin: '0 0 0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Atrasadas</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#9a3412', margin: 0 }}>{pending.summary.totalDelayed}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Vacinas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {schedule.schedule.map((item: any) => (
                    <div key={item.vaccine.id} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                            <Syringe size={18} color="var(--primary)" />
                            <h4 style={{ margin: 0 }}>{item.vaccine.name}</h4>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                            {item.vaccine.description}
                          </p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {item.appliedDoses.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Doses Aplicadas:</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {item.appliedDoses.map((dose: any, idx: number) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                <CheckCircle size={14} color="var(--status-green)" />
                                <span>
                                  Dose {dose.dose}: {new Date(dose.date).toLocaleDateString('pt-BR')}
                                  {dose.batchNumber && ` - Lote: ${dose.batchNumber}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.nextDose && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e40af' }}>
                          Próxima dose: {item.nextDose}ª dose
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState 
                icon={Syringe}
                title="Nenhuma vacina aplicável"
                description="Não há vacinas aplicáveis para esta faixa etária no momento."
              />
            )}
          </motion.div>
        </div>
      )}

      {/* Modal de Aplicação */}
      {showApplicationModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          backdropFilter: 'blur(4px)' 
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card"
            style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--primary)15', color: 'var(--primary)' }}>
                  <Syringe size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Registrar Aplicação de Vacina</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Paciente: {selectedPatient?.fullName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedVaccineId('');
                  setDose(1);
                  setBatchNumber('');
                }} 
                className="btn" 
                style={{ padding: '8px', backgroundColor: 'transparent' }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleApplyVaccine(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Vacina *
                </label>
                <select
                  required
                  value={selectedVaccineId}
                  onChange={(e) => setSelectedVaccineId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                >
                  <option value="">Selecione uma vacina</option>
                  {vaccines && vaccines.length > 0 ? (
                    vaccines.map((vaccine) => (
                      <option key={vaccine.id} value={vaccine.id}>
                        {vaccine.name} - {vaccine.description}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Nenhuma vacina disponível</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                    Dose *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={dose}
                    onChange={(e) => setDose(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                    Lote
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Opcional"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Data e Hora da Aplicação *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedVaccineId('');
                    setDose(1);
                    setBatchNumber('');
                  }}
                  className="btn"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={applyVaccineMutation.isPending || !selectedVaccineId}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (applyVaccineMutation.isPending || !selectedVaccineId) ? 0.6 : 1,
                    cursor: (applyVaccineMutation.isPending || !selectedVaccineId) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {applyVaccineMutation.isPending ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid white', 
                        borderTopColor: 'transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 0.6s linear infinite' 
                      }} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Registrar Aplicação
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
