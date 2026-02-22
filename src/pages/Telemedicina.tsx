import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Video, MessageSquare, Phone, FileText, Calendar, User, Plus, Search } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Telemedicine() {
  const [viewMode, setViewMode] = useState<'consultations' | 'prescriptions' | 'certificates'>('consultations');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationType, setConsultationType] = useState<'VIDEO' | 'CHAT' | 'PHONE'>('VIDEO');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();

  // Buscar teleconsultas
  const { data: consultations, isLoading: loadingConsultations } = useQuery({
    queryKey: ['teleconsultations'],
    queryFn: async () => {
      const response = await api.get('/telemedicine/consultations');
      return response.data.data;
    },
    enabled: viewMode === 'consultations',
  });

  // Buscar prescrições digitais
  const { data: prescriptions, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ['digital-prescriptions'],
    queryFn: async () => {
      const response = await api.get('/telemedicine/prescriptions');
      return response.data.data;
    },
    enabled: viewMode === 'prescriptions',
  });

  // Buscar atestados
  const { data: certificates, isLoading: loadingCertificates } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const response = await api.get('/telemedicine/certificates');
      return response.data.data;
    },
    enabled: viewMode === 'certificates',
  });

  // Buscar pacientes
  const { data: patients } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/patients?search=${searchTerm}&limit=20`);
      return response.data.patients;
    },
    enabled: searchTerm.length >= 3 && showModal,
  });

  // Criar teleconsulta
  const createConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/telemedicine/consultations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teleconsultations'] });
      setShowModal(false);
      setSelectedPatientId('');
      setSearchTerm('');
      setReason('');
      alert('Teleconsulta agendada com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao agendar teleconsulta');
    }
  });

  const handleCreateConsultation = () => {
    if (!selectedPatientId || !scheduledDate || !reason) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    createConsultationMutation.mutate({
      patientId: selectedPatientId,
      type: consultationType,
      scheduledDate: new Date(scheduledDate).toISOString(),
      reason,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video size={16} />;
      case 'CHAT': return <MessageSquare size={16} />;
      case 'PHONE': return <Phone size={16} />;
      default: return <Video size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'Vídeo';
      case 'CHAT': return 'Chat';
      case 'PHONE': return 'Telefone';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      SCHEDULED: { bg: '#dbeafe', color: '#1e40af', label: 'Agendada' },
      IN_PROGRESS: { bg: '#dcfce7', color: '#166534', label: 'Em Andamento' },
      COMPLETED: { bg: '#f3f4f6', color: '#374151', label: 'Concluída' },
      CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelada' }
    };
    const config = styles[status] || styles.SCHEDULED;
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

  const isLoading = loadingConsultations || loadingPrescriptions || loadingCertificates;

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando dados de telemedicina..." />
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Telemedicina
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Atendimento remoto e documentos digitais
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setViewMode('consultations')}
            className={viewMode === 'consultations' ? 'btn btn-primary' : 'btn'}
          >
            Teleconsultas
          </button>
          <button
            onClick={() => setViewMode('prescriptions')}
            className={viewMode === 'prescriptions' ? 'btn btn-primary' : 'btn'}
          >
            Prescrições
          </button>
          <button
            onClick={() => setViewMode('certificates')}
            className={viewMode === 'certificates' ? 'btn btn-primary' : 'btn'}
          >
            Atestados
          </button>
          {viewMode === 'consultations' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Agendar
            </button>
          )}
        </div>
      </header>

      {/* Teleconsultas */}
      {viewMode === 'consultations' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Teleconsultas Agendadas</h3>
          {consultations && consultations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {consultations.map((consult: any) => (
                <div key={consult.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <User size={18} color="var(--primary)" />
                        <h4 style={{ margin: 0 }}>{consult.patient.fullName}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {getTypeIcon(consult.type)}
                          <span>{getTypeLabel(consult.type)}</span>
                        </div>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} />
                          <span>{new Date(consult.scheduledDate).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(consult.status)}
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <span style={{ fontWeight: 600 }}>Motivo:</span> {consult.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Video}
              title="Nenhuma teleconsulta agendada"
              description="Não há teleconsultas agendadas no momento."
            />
          )}
        </motion.div>
      )}

      {/* Prescrições Digitais */}
      {viewMode === 'prescriptions' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Prescrições Digitais</h3>
          {prescriptions && prescriptions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {prescriptions.map((prescription: any) => (
                <div key={prescription.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <FileText size={18} color="var(--primary)" />
                        <h4 style={{ margin: 0 }}>{prescription.patient.fullName}</h4>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(prescription.issueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: 'var(--background)', borderRadius: '12px' }}>
                      Assinatura: {prescription.digitalSignature ? '✓' : '✗'}
                    </span>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {prescription.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhuma prescrição digital"
              description="Não há prescrições digitais registradas."
            />
          )}
        </motion.div>
      )}

      {/* Atestados */}
      {viewMode === 'certificates' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem' }}>Atestados Médicos</h3>
          {certificates && certificates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {certificates.map((certificate: any) => (
                <div key={certificate.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <FileText size={18} color="var(--accent)" />
                        <h4 style={{ margin: 0 }}>{certificate.patient.fullName}</h4>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(certificate.issueDate).toLocaleDateString('pt-BR')} • {certificate.days} dias
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <span style={{ fontWeight: 600 }}>CID:</span> {certificate.cid || 'Não especificado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum atestado emitido"
              description="Não há atestados médicos registrados."
            />
          )}
        </motion.div>
      )}

      {/* Modal de Agendamento */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Agendar Teleconsulta</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Paciente *
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Digite o nome, CPF ou CNS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input"
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                </div>

                {patients && patients.length > 0 && (
                  <div style={{ marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                          CPF: {patient.cpf}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Tipo de Consulta *
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as any)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="VIDEO">Vídeo</option>
                  <option value="CHAT">Chat</option>
                  <option value="PHONE">Telefone</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Motivo *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo da consulta..."
                  rows={3}
                  className="input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateConsultation}
                disabled={createConsultationMutation.isPending}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {createConsultationMutation.isPending ? 'Agendando...' : 'Agendar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
