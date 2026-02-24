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
      case 'VIDEO': return Video;
      case 'CHAT': return MessageSquare;
      case 'PHONE': return Phone;
      default: return Video;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'var(--primary)';
      case 'CHAT': return 'var(--accent)';
      case 'PHONE': return 'var(--success)';
      default: return 'var(--primary)';
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
      <header className="page-header">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Telemedicina
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Atendimento remoto e documentos digitais
          </p>
        </div>
        <div className="actions-wrap">
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
          {consultations && consultations.length > 0 ? (
            <>
              <div className="desktop-only table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paciente</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tipo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Data/Hora</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Motivo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consult: any) => {
                    const TypeIcon = getTypeIcon(consult.type);
                    return (
                      <motion.tr
                        key={consult.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        whileHover={{ backgroundColor: 'var(--background)' }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} color="var(--text-muted)" />
                            <span style={{ fontWeight: 500 }}>{consult.patient.fullName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TypeIcon size={16} color={getTypeColor(consult.type)} />
                            <span style={{ fontSize: '0.875rem' }}>{getTypeLabel(consult.type)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} color="var(--primary)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {new Date(consult.scheduledDate).toLocaleDateString('pt-BR')}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(consult.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                          {consult.reason}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getStatusBadge(consult.status)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-card-list">
                {consultations.map((consult: any) => {
                  const TypeIcon = getTypeIcon(consult.type);
                  return (
                    <div key={`mobile-${consult.id}`} className="mobile-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>{consult.patient.fullName}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getTypeLabel(consult.type)}</p>
                        </div>
                        {getStatusBadge(consult.status)}
                      </div>

                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Canal</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <TypeIcon size={14} color={getTypeColor(consult.type)} />
                          {getTypeLabel(consult.type)}
                        </span>
                      </div>

                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Data/Hora</span>
                        <span>
                          {new Date(consult.scheduledDate).toLocaleDateString('pt-BR')} {new Date(consult.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Motivo</span>
                        <span style={{ textAlign: 'right' }}>{consult.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Video}
              title="Nenhuma teleconsulta agendada"
              description="Não há teleconsultas agendadas no momento. Clique em 'Agendar' para criar uma nova."
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
          {prescriptions && prescriptions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {prescriptions.map((prescription: any) => (
                <div key={prescription.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <FileText size={18} color="var(--primary)" />
                        <h4 style={{ margin: 0 }}>{prescription.patient.fullName}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        <span>{new Date(prescription.issueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: prescription.digitalSignature ? '#dcfce7' : '#fee2e2',
                      color: prescription.digitalSignature ? '#166534' : '#991b1b',
                      fontWeight: 600
                    }}>
                      {prescription.digitalSignature ? '✓ Assinada' : '✗ Não Assinada'}
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
              description="Não há prescrições digitais registradas no sistema."
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
          {certificates && certificates.length > 0 ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {certificates.map((certificate: any) => (
                <div key={certificate.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <FileText size={20} color="var(--accent)" />
                    <h4 style={{ margin: 0 }}>{certificate.patient.fullName}</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Data de Emissão:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(certificate.issueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Dias de Afastamento:</span>
                      <span style={{ fontWeight: 600 }}>{certificate.days} dias</span>
                    </div>
                    {certificate.cid && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>CID:</span>
                        <span style={{ fontWeight: 600 }}>{certificate.cid}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum atestado emitido"
              description="Não há atestados médicos registrados no sistema."
            />
          )}
        </motion.div>
      )}

      {/* Modal de Agendamento */}
      {showModal && (
        <div className="modal-shell" style={{ zIndex: 50 }}>
          <motion.div
            className="card modal-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '500px' }}
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
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearchTerm('');
                  setSelectedPatientId('');
                  setReason('');
                }}
                className="btn"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateConsultation}
                disabled={createConsultationMutation.isPending}
                className="btn btn-primary"
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
