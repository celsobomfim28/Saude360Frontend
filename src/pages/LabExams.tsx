import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FlaskConical, Plus, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuthStore } from '../stores/authStore';

const EXAM_TYPES = [
  { value: 'HEMOGRAM', label: 'Hemograma Completo', category: 'Hematologia' },
  { value: 'GLUCOSE', label: 'Glicemia', category: 'Bioquímica' },
  { value: 'HBA1C', label: 'Hemoglobina Glicada', category: 'Bioquímica' },
  { value: 'TOTAL_CHOLESTEROL', label: 'Colesterol Total', category: 'Bioquímica' },
  { value: 'HDL_CHOLESTEROL', label: 'HDL', category: 'Bioquímica' },
  { value: 'LDL_CHOLESTEROL', label: 'LDL', category: 'Bioquímica' },
  { value: 'TRIGLYCERIDES', label: 'Triglicerídeos', category: 'Bioquímica' },
  { value: 'UREA', label: 'Ureia', category: 'Bioquímica' },
  { value: 'CREATININE', label: 'Creatinina', category: 'Bioquímica' },
  { value: 'TGO_AST', label: 'TGO/AST', category: 'Função Hepática' },
  { value: 'TGP_ALT', label: 'TGP/ALT', category: 'Função Hepática' },
  { value: 'TSH', label: 'TSH', category: 'Hormônios' },
  { value: 'SYPHILIS_VDRL', label: 'VDRL (Sífilis)', category: 'Sorologia' },
  { value: 'HIV', label: 'Anti-HIV', category: 'Sorologia' },
  { value: 'HEPATITIS_B', label: 'Hepatite B', category: 'Sorologia' },
  { value: 'HEPATITIS_C', label: 'Hepatite C', category: 'Sorologia' },
  { value: 'URINALYSIS', label: 'Urina Tipo 1', category: 'Urina' },
  { value: 'STOOL_EXAM', label: 'Parasitológico de Fezes', category: 'Fezes' },
];

export function LabExams() {
  const { user } = useAuthStore();
  const canEvaluate = user?.role === 'MEDICO' || user?.role === 'ENFERMEIRO';

  const [view, setView] = useState<'list' | 'create' | 'pending'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const queryClient = useQueryClient();

  // Buscar solicitações
  const { data: requests, isLoading, error: requestsError } = useQuery({
    queryKey: ['lab-exam-requests', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/lab-exams/requests${params}`);
      return response.data;
    },
    retry: false
  });

  // Buscar pacientes
  const { data: patients } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/patients?search=${searchTerm}&limit=20`);
      return response.data.patients;
    },
    enabled: searchTerm.length >= 3
  });

  // Buscar exames pendentes de avaliação
  const { data: pendingEvaluations, error: pendingError } = useQuery({
    queryKey: ['pending-evaluations'],
    queryFn: async () => {
      const response = await api.get('/lab-exams/pending-evaluations');
      return response.data;
    },
    enabled: view === 'pending' && canEvaluate,
    retry: false
  });

  // Criar solicitação
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/lab-exams/requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-exam-requests'] });
      setView('list');
      setSelectedPatientId('');
      setSelectedExams([]);
      setClinicalInfo('');
      alert('Solicitação criada com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao criar solicitação');
    }
  });

  // Avaliar exame
  const evaluateMutation = useMutation({
    mutationFn: async ({ examId, observations }: any) => {
      return await api.post(`/lab-exams/${examId}/evaluate`, { observations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['lab-exam-requests'] });
      alert('Exame avaliado com sucesso!');
    }
  });

  const handleCreateRequest = () => {
    if (!selectedPatientId || selectedExams.length === 0) {
      alert('Selecione um paciente e pelo menos um exame');
      return;
    }

    createRequestMutation.mutate({
      patientId: selectedPatientId,
      examTypes: selectedExams,
      priority,
      clinicalInfo: clinicalInfo || undefined
    });
  };

  const toggleExam = (examType: string) => {
    setSelectedExams(prev =>
      prev.includes(examType)
        ? prev.filter(e => e !== examType)
        : [...prev, examType]
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pendente' },
      COLLECTED: { bg: '#dbeafe', color: '#1e40af', label: 'Coletado' },
      IN_ANALYSIS: { bg: '#e9d5ff', color: '#6b21a8', label: 'Em Análise' },
      COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Concluído' },
      CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelado' }
    };
    const config = styles[status] || styles.PENDING;
    return (
      <span style={{
        display: 'inline-flex',
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

  const getPriorityBadge = (priority: string) => {
    const styles: any = {
      ROUTINE: { bg: '#f3f4f6', color: '#374151', label: 'Rotina' },
      URGENT: { bg: '#fed7aa', color: '#9a3412', label: 'Urgente' },
      EMERGENCY: { bg: '#fee2e2', color: '#991b1b', label: 'Emergência' }
    };
    const config = styles[priority] || styles.ROUTINE;
    return (
      <span style={{
        display: 'inline-flex',
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

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando exames..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Exames Laboratoriais
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerencie solicitações e resultados de exames
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setView('list')}
            className={view === 'list' ? 'btn btn-primary' : 'btn'}
          >
            Solicitações
          </button>
          <button
            onClick={() => setView('pending')}
            className={view === 'pending' ? 'btn btn-primary' : 'btn'}
            disabled={!canEvaluate}
            title={!canEvaluate ? 'Apenas médicos e enfermeiros podem avaliar exames pendentes' : undefined}
          >
            Pendentes
          </button>
          <button
            onClick={() => setView('create')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nova Solicitação
          </button>
        </div>
      </header>

      {/* Lista de Solicitações */}
      {view === 'list' && (
        <>
          <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minWidth: '200px' }}
            >
              <option value="">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="COLLECTED">Coletado</option>
              <option value="IN_ANALYSIS">Em Análise</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {requestsError && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
                Erro ao carregar solicitações de exames. Tente novamente mais tarde.
              </div>
            )}

            {requests && requests.length === 0 ? (
              <EmptyState 
                icon={FlaskConical}
                title="Nenhuma solicitação encontrada"
                description="Não há solicitações de exames com os filtros selecionados."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests?.map((request: any) => (
                  <div key={request.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                          <User size={18} color="var(--primary)" />
                          <h4 style={{ margin: 0 }}>{request.patient.fullName}</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                          CPF: {request.patient.cpf} | CNS: {request.patient.cns}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Calendar size={14} />
                          <span>{new Date(request.requestDate).toLocaleString('pt-BR')}</span>
                          <span>•</span>
                          <span>Solicitado por: {request.requestedBy.fullName}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                    </div>

                    {request.clinicalInfo && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                          {request.clinicalInfo}
                        </p>
                      </div>
                    )}

                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Exames Solicitados:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {request.exams.map((exam: any) => (
                          <span key={exam.id} style={{ padding: '4px 10px', backgroundColor: 'var(--background)', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {EXAM_TYPES.find(e => e.value === exam.examType)?.label || exam.examType}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Nova Solicitação */}
      {view === 'create' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ marginBottom: '1.5rem' }}>Nova Solicitação de Exames</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Busca de Paciente */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Paciente *
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Digite o nome, CPF ou CNS do paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                />
              </div>

              {patients && patients.length > 0 && (
                <div style={{ marginTop: '0.75rem', maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {patients.map((patient: any) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setSearchTerm(patient.fullName);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{patient.fullName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        CPF: {patient.cpf} | CNS: {patient.cns}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Seleção de Exames */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Exames * ({selectedExams.length} selecionados)
              </label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {Object.entries(
                  EXAM_TYPES.reduce((acc, exam) => {
                    if (!acc[exam.category]) acc[exam.category] = [];
                    acc[exam.category].push(exam);
                    return acc;
                  }, {} as Record<string, typeof EXAM_TYPES>)
                ).map(([category, exams]) => (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{category}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {exams.map((exam) => (
                        <label key={exam.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedExams.includes(exam.value)}
                            onChange={() => toggleExam(exam.value)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>{exam.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioridade */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Prioridade *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="ROUTINE">Rotina</option>
                <option value="URGENT">Urgente</option>
                <option value="EMERGENCY">Emergência</option>
              </select>
            </div>

            {/* Informações Clínicas */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Informações Clínicas
              </label>
              <textarea
                value={clinicalInfo}
                onChange={(e) => setClinicalInfo(e.target.value)}
                placeholder="Hipótese diagnóstica, sintomas, etc..."
                rows={3}
                className="input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setView('list')}
              className="btn"
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={createRequestMutation.isPending}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {createRequestMutation.isPending ? 'Criando...' : 'Criar Solicitação'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Pendentes de Avaliação */}
      {view === 'pending' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ marginBottom: '1.5rem' }}>Exames Pendentes de Avaliação</h2>

          {!canEvaluate && (
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#ffedd5', color: '#9a3412', fontSize: '0.875rem' }}>
              Você não possui permissão para visualizar exames pendentes de avaliação.
            </div>
          )}

          {canEvaluate && pendingError && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
              Erro ao carregar exames pendentes. Tente novamente mais tarde.
            </div>
          )}

          {canEvaluate && pendingEvaluations && pendingEvaluations.length === 0 ? (
            <EmptyState 
              icon={FlaskConical}
              title="Nenhum exame pendente"
              description="Não há exames pendentes de avaliação no momento."
            />
          ) : (
            canEvaluate && <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingEvaluations?.map((exam: any) => (
                <div key={exam.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <FlaskConical size={18} color="var(--primary)" />
                      <h4 style={{ margin: 0 }}>{exam.request.patient.fullName}</h4>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                      Exame: {EXAM_TYPES.find(e => e.value === exam.examType)?.label || exam.examType}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>Resultado em: {new Date(exam.resultDate).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {exam.resultText && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Resultado:</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{exam.resultText}</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const observations = prompt('Observações da avaliação:');
                      if (observations !== null) {
                        evaluateMutation.mutate({ examId: exam.id, observations });
                      }
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Avaliar Exame
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
