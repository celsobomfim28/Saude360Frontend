import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Clipboard,
    History,
    Activity,
    Stethoscope,
    AlertCircle,
    User,
    MapPin,
    Phone,
    Calendar,
    Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import ChronicConsultationModal from '../components/ChronicConsultationModal';
import AppointmentModal from '../components/AppointmentModal';
import HomeVisitModal from '../components/HomeVisitModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clinical'); // clinical, history, indicators
    const [isHasModalOpen, setIsHasModalOpen] = useState(false);
    const [isDmModalOpen, setIsDmModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isHomeVisitModalOpen, setIsHomeVisitModalOpen] = useState(false);

    const { data: patient, isLoading } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const response = await api.get(`/patients/${id}`);
            return response.data.data || response.data;
        }
    });

    const { data: indicators } = useQuery({
        queryKey: ['patient-indicators', id],
        queryFn: async () => {
            const response = await api.get(`/patients/${id}/indicators`);
            return response.data;
        },
        enabled: !!id
    });

    const { data: timeline } = useQuery({
        queryKey: ['patient-timeline', id],
        queryFn: async () => {
            const response = await api.get(`/patients/${id}/timeline`);
            return response.data;
        },
        enabled: !!id && activeTab === 'history'
    });

    if (isLoading) {
        return (
            <div className="container">
                <LoadingSpinner fullScreen message="Carregando dados do paciente..." />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>Paciente não encontrado</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    O paciente que você está procurando não existe ou foi removido.
                </p>
                <button onClick={() => navigate('/patients')} className="btn btn-primary">
                    Voltar para Lista de Pacientes
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: '2rem', display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                <ArrowLeft size={20} />
                Voltar
            </button>

            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                        {patient?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <h1 style={{ margin: 0 }}>{patient?.fullName || 'Carregando...'}</h1>
                            {!patient?.deletedAt ? (
                                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }}>Ativo</span>
                            ) : (
                                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>Inativo</span>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>CPF: {patient.cpf} • CNS: {patient.cns} • {patient.age} anos</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsAppointmentModalOpen(true)} className="btn card" style={{ display: 'flex', gap: '8px' }}>
                        <Calendar size={20} />
                        Agendar
                    </button>
                    <button onClick={() => setIsHomeVisitModalOpen(true)} className="btn card" style={{ display: 'flex', gap: '8px' }}>
                        <Home size={20} />
                        Visita
                    </button>
                    {patient.hasHypertension && (
                        <button onClick={() => setIsHasModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', gap: '8px', backgroundColor: '#dc2626' }}>
                            <Activity size={20} />
                            Consulta HAS
                        </button>
                    )}
                    {patient.hasDiabetes && (
                        <button onClick={() => setIsDmModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', gap: '8px', backgroundColor: '#0284c7' }}>
                            <Stethoscope size={20} />
                            Consulta DM
                        </button>
                    )}
                </div>
            </header>

            <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Sidebar Info */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section className="card">
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="var(--primary)" /> Dados Pessoais
                        </h4>
                        <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Mãe</label>
                                <span>{patient.motherName}</span>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Nascimento</label>
                                <span>{new Date(patient.birthDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Sexo</label>
                                <span>{patient.sex === 'FEMALE' ? 'Feminino' : 'Masculino'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="card">
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} color="var(--primary)" /> Localização
                        </h4>
                        <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Microárea</label>
                                <span>Área {patient.microArea?.name || 'Não definida'}</span>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Endereço</label>
                                <span>{patient.address?.street || 'Não informado'}, {patient.address?.number || 'S/N'}</span>
                                <p style={{ margin: 0, opacity: 0.7 }}>{patient.address?.neighborhood || 'Não informado'}</p>
                            </div>
                        </div>
                    </section>

                    <section className="card">
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={18} color="var(--primary)" /> Contato
                        </h4>
                        <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {patient.primaryPhone && (
                                <div>
                                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Telefone Principal</label>
                                    <span>{patient.primaryPhone}</span>
                                </div>
                            )}
                            {patient.secondaryPhone && (
                                <div>
                                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Telefone Secundário</label>
                                    <span>{patient.secondaryPhone}</span>
                                </div>
                            )}
                            {patient.email && (
                                <div>
                                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>E-mail</label>
                                    <span style={{ wordBreak: 'break-all' }}>{patient.email}</span>
                                </div>
                            )}
                            {!patient.primaryPhone && !patient.secondaryPhone && !patient.email && (
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem informações de contato</p>
                            )}
                        </div>
                    </section>
                </aside>

                {/* Main Content Area */}
                <main>
                    {/* Tabs */}
                    <div className="card glass" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '8px' }}>
                        {[
                            { id: 'clinical', label: 'Quadro Clínico', icon: Activity },
                            { id: 'indicators', label: 'Indicadores', icon: Clipboard },
                            { id: 'history', label: 'Linha do Tempo', icon: History }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    backgroundColor: activeTab === tab.id ? '' : 'transparent',
                                    color: activeTab === tab.id ? '' : 'var(--text-muted)'
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <section style={{ minHeight: '400px' }}>
                        {activeTab === 'clinical' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="card" style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Elegibilidade e Programas</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {patient.hasHypertension && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}>
                                                HIPERTENSÃO
                                            </span>
                                        )}
                                        {patient.hasDiabetes && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', fontWeight: 600, fontSize: '0.75rem' }}>
                                                DIABETES
                                            </span>
                                        )}
                                        {patient.isPregnant && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }}>
                                                GESTANTE
                                            </span>
                                        )}
                                        {patient.isPostpartum && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#fce7f3', color: '#9f1239', fontWeight: 600, fontSize: '0.75rem' }}>
                                                PUÉRPERA
                                            </span>
                                        )}
                                        {patient.isChild && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontWeight: 600, fontSize: '0.75rem' }}>
                                                CRIANÇA
                                            </span>
                                        )}
                                        {patient.isElderly && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#f3e8ff', color: '#6b21a8', fontWeight: 600, fontSize: '0.75rem' }}>
                                                IDOSO
                                            </span>
                                        )}
                                        {patient.isWoman && !patient.isPregnant && !patient.isPostpartum && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#fce7f3', color: '#be185d', fontWeight: 600, fontSize: '0.75rem' }}>
                                                SAÚDE DA MULHER
                                            </span>
                                        )}
                                        {!patient.hasHypertension && !patient.hasDiabetes && !patient.isPregnant && !patient.isPostpartum && !patient.isChild && !patient.isElderly && !patient.isWoman && (
                                            <span style={{ padding: '6px 12px', borderRadius: '12px', background: '#f3f4f6', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem' }}>
                                                NENHUM PROGRAMA ATIVO
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {patient.hasHypertension && (
                                        <div className="card" style={{ borderTop: '4px solid #dc2626' }}>
                                            <h4 style={{ marginBottom: '1rem', color: '#dc2626' }}>Hipertensão</h4>
                                            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Data do Diagnóstico</label>
                                                    <span>{patient.hypertensionDiagnosisDate ? new Date(patient.hypertensionDiagnosisDate).toLocaleDateString('pt-BR') : 'Não informada'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {patient.hasDiabetes && (
                                        <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
                                            <h4 style={{ marginBottom: '1rem', color: '#0284c7' }}>Diabetes</h4>
                                            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Data do Diagnóstico</label>
                                                    <span>{patient.diabetesDiagnosisDate ? new Date(patient.diabetesDiagnosisDate).toLocaleDateString('pt-BR') : 'Não informada'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Alertas Clínicos</h4>
                                        {(() => {
                                            const criticalAlerts: string[] = [];
                                            
                                            // Verificar indicadores RED
                                            if (indicators?.indicators) {
                                                // Diabetes
                                                if (indicators.indicators.diabetes) {
                                                    const d = indicators.indicators.diabetes;
                                                    if (d.d1Status === 'RED') criticalAlerts.push('Diabetes: Consulta anual pendente');
                                                    if (d.d2Status === 'RED') criticalAlerts.push('Diabetes: Aferição de PA pendente');
                                                    if (d.d5Status === 'RED') criticalAlerts.push('Diabetes: Exame HbA1c pendente');
                                                    if (d.d6Status === 'RED') criticalAlerts.push('Diabetes: Exame de pés pendente');
                                                }
                                                
                                                // Hipertensão
                                                if (indicators.indicators.hypertension) {
                                                    const h = indicators.indicators.hypertension;
                                                    if (h.e1Status === 'RED') criticalAlerts.push('Hipertensão: Consulta anual pendente');
                                                    if (h.e2Status === 'RED') criticalAlerts.push('Hipertensão: Aferição de PA pendente');
                                                }
                                                
                                                // Pré-natal
                                                if (indicators.indicators.prenatal) {
                                                    const p = indicators.indicators.prenatal;
                                                    if (p.c1Status === 'RED') criticalAlerts.push('Pré-natal: Consultas insuficientes');
                                                    if (p.c6Status === 'RED') criticalAlerts.push('Pré-natal: Exames pendentes');
                                                }
                                                
                                                // Puericultura
                                                if (indicators.indicators.childcare) {
                                                    const c = indicators.indicators.childcare;
                                                    if (c.b1Status === 'RED') criticalAlerts.push('Puericultura: 1ª consulta pendente');
                                                    if (c.b2Status === 'RED') criticalAlerts.push('Puericultura: Consultas insuficientes');
                                                    if (c.b5Status === 'RED') criticalAlerts.push('Puericultura: Vacinas atrasadas');
                                                }
                                                
                                                // Idoso
                                                if (indicators.indicators.elderly) {
                                                    const e = indicators.indicators.elderly;
                                                    if (e.f1Status === 'RED') criticalAlerts.push('Idoso: Avaliação de polifarmácia pendente');
                                                    if (e.f2Status === 'RED') criticalAlerts.push('Idoso: Avaliação IVCF-20 pendente');
                                                }
                                                
                                                // Saúde da Mulher
                                                if (indicators.indicators.womanHealth) {
                                                    const w = indicators.indicators.womanHealth;
                                                    if (w.g1Status === 'RED') criticalAlerts.push('Saúde da Mulher: Citopatológico pendente');
                                                    if (w.g2Status === 'RED') criticalAlerts.push('Saúde da Mulher: Mamografia pendente');
                                                }
                                            }
                                            
                                            return criticalAlerts.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {criticalAlerts.map((alert, idx) => (
                                                        <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.875rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <AlertCircle size={18} />
                                                            <span>{alert}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.875rem', display: 'flex', gap: '10px' }}>
                                                    <AlertCircle size={20} />
                                                    <span>Nenhum alerta crítico. Paciente com acompanhamento em dia.</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'indicators' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="card">
                                    <h4 style={{ marginBottom: '2rem' }}>Status dos Indicadores</h4>
                                    {indicators?.indicators ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {/* Pré-Natal Indicators */}
                                            {indicators.indicators.prenatal && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Pré-Natal</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'C1', label: 'Consultas', value: `${indicators.indicators.prenatal.prenatalConsultationCount}/7` },
                                                            { code: 'C2', label: 'Aferições PA', value: `${indicators.indicators.prenatal.bloodPressureCount}/7` },
                                                            { code: 'C3', label: 'Peso/Altura', value: indicators.indicators.prenatal.weightHeightRecorded ? 'Sim' : 'Não' },
                                                            { code: 'C4', label: 'Visitas ACS', value: 'Pendente' },
                                                            { code: 'C5', label: 'Vacina dTpa', value: indicators.indicators.prenatal.dtpaVaccineDate ? 'Sim' : 'Não' },
                                                            { code: 'C6', label: 'Exames', value: indicators.indicators.prenatal.exams1stTriCompleted ? 'Completo' : 'Pendente' }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.prenatal[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Childcare Indicators */}
                                            {indicators.indicators.childcare && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Puericultura</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'B1', label: '1ª Consulta', value: indicators.indicators.childcare.firstConsultationDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'B2', label: 'Consultas', value: `${indicators.indicators.childcare.consultationCount}/9` },
                                                            { code: 'B3', label: 'Peso/Altura', value: `${indicators.indicators.childcare.anthropometryCount}/9` },
                                                            { code: 'B4', label: 'Visitas ACS', value: `${indicators.indicators.childcare.vd1Date ? 1 : 0}${indicators.indicators.childcare.vd2Date ? '+1' : ''}/2` },
                                                            { code: 'B5', label: 'Vacinas', value: indicators.indicators.childcare.vaccineStatus }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.childcare[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Diabetes Indicators */}
                                            {indicators.indicators.diabetes && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: '#dc2626' }}>Diabetes</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'D1', label: 'Consulta Anual', value: indicators.indicators.diabetes.lastConsultationDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'D2', label: 'Aferição PA', value: indicators.indicators.diabetes.lastBloodPressureDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'D3', label: 'Peso/Altura', value: indicators.indicators.diabetes.lastAnthropometryDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'D4', label: 'Visitas (12m)', value: `${indicators.indicators.diabetes.visitCountLast12Months}/2` },
                                                            { code: 'D5', label: 'HbA1c', value: indicators.indicators.diabetes.lastHba1cDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'D6', label: 'Exame Pés', value: indicators.indicators.diabetes.lastFootExamDate ? 'Realizado' : 'Pendente' }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.diabetes[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Hypertension Indicators */}
                                            {indicators.indicators.hypertension && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: '#ea580c' }}>Hipertensão</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'E1', label: 'Consulta Anual', value: indicators.indicators.hypertension.lastConsultationDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'E2', label: 'Aferição PA', value: indicators.indicators.hypertension.lastBloodPressureDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'E3', label: 'Peso/Altura', value: indicators.indicators.hypertension.lastAnthropometryDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'E4', label: 'Visitas (12m)', value: `${indicators.indicators.hypertension.visitCountLast12Months}/2` }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.hypertension[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Elderly Indicators */}
                                            {indicators.indicators.elderly && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: '#7c3aed' }}>Idosos</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'F1', label: 'Consulta Anual', value: indicators.indicators.elderly.lastConsultationDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'F2', label: 'Avaliação Funcional', value: indicators.indicators.elderly.lastFunctionalAssessmentDate ? 'Realizada' : 'Pendente' },
                                                            { code: 'F3', label: 'Vacinas', value: indicators.indicators.elderly.vaccineStatus },
                                                            { code: 'F4', label: 'Visitas (12m)', value: `${indicators.indicators.elderly.visitCountLast12Months}/2` }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.elderly[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Woman Health Indicators */}
                                            {indicators.indicators.womanHealth && (
                                                <section>
                                                    <h5 style={{ marginBottom: '1rem', color: '#ec4899' }}>Saúde da Mulher</h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {[
                                                            { code: 'G1', label: 'Citopatológico', value: indicators.indicators.womanHealth.lastCytopathologicalExamDate ? 'Realizado' : 'Pendente' },
                                                            { code: 'G2', label: 'Mamografia', value: indicators.indicators.womanHealth.lastMammographyDate ? 'Realizada' : 'Pendente' }
                                                        ].map((ind) => {
                                                            const status = indicators.indicators.womanHealth[`${ind.code.toLowerCase()}Status`];
                                                            return (
                                                                <div key={ind.code} className="card glass" style={{ padding: '1rem', borderLeft: `4px solid var(--status-${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'})` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ind.code}</span>
                                                                        <div className={`status-dot ${status === 'GREEN' ? 'green' : status === 'YELLOW' ? 'yellow' : 'red'}`}></div>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{ind.label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ind.value}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Summary */}
                                            <section className="card glass" style={{ padding: '1.5rem' }}>
                                                <h5 style={{ marginBottom: '1rem' }}>Resumo Geral</h5>
                                                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-green)' }}>{indicators.summary.green}</div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Em Dia</p>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-yellow)' }}>{indicators.summary.yellow}</div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Atenção</p>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-red)' }}>{indicators.summary.red}</div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Atrasado</p>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    ) : (
                                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum indicador disponível para este paciente.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="card">
                                    <h4 style={{ marginBottom: '2rem' }}>Histórico de Atendimentos</h4>
                                    {timeline?.events && timeline.events.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', paddingLeft: '2rem' }}>
                                            <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--border)' }}></div>
                                            {timeline.events.map((event: any, index: number) => (
                                                <div key={index} style={{ position: 'relative' }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '-2rem',
                                                        top: '0',
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '50%',
                                                        backgroundColor: event.type === 'PRENATAL_CONSULTATION' ? 'var(--accent)' :
                                                            event.type === 'HOME_VISIT' ? 'var(--primary)' :
                                                                event.type === 'VACCINE' ? 'var(--success)' : 'var(--text-muted)',
                                                        border: '4px solid white',
                                                        boxShadow: '0 0 0 2px currentColor'
                                                    }}></div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                            {new Date(event.date).toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p style={{ margin: '4px 0 8px', fontWeight: 600 }}>{event.title}</p>
                                                        {event.description && (
                                                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{event.description}</p>
                                                        )}
                                                        {event.professional && (
                                                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                Por: {event.professional}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', paddingLeft: '2rem' }}>
                                            <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--border)' }}></div>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', left: '-2rem', top: '0', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--primary)', border: '4px solid white', boxShadow: '0 0 0 2px var(--primary)' }}></div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
                                                    <p style={{ margin: '4px 0 8px', fontWeight: 600 }}>Cadastro Inicial</p>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Paciente cadastrado no sistema</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </section>
                </main>
            </div>

            <ChronicConsultationModal
                isOpen={isHasModalOpen}
                onClose={() => setIsHasModalOpen(false)}
                patientId={id || ''}
                patientName={patient.fullName}
                type="HYPERTENSION"
            />

            <ChronicConsultationModal
                isOpen={isDmModalOpen}
                onClose={() => setIsDmModalOpen(false)}
                patientId={id || ''}
                patientName={patient.fullName}
                type="DIABETES"
            />

            <AppointmentModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                patientId={id || ''}
                patientName={patient.fullName}
            />

            <HomeVisitModal
                isOpen={isHomeVisitModalOpen}
                onClose={() => setIsHomeVisitModalOpen(false)}
                patientId={id || ''}
                patientName={patient.fullName}
            />
        </div>
    );
}
