import { useState } from 'react';
import { Calendar, Clock, User, Filter, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Appointments() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', statusFilter, dateFilter],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;
            
            const response = await api.get('/appointments', { params });
            return response.data.data || [];
        }
    });

    const filteredAppointments = appointments?.filter((apt: any) =>
        apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const styles: any = {
            SCHEDULED: { bg: '#dbeafe', color: '#1e40af', icon: Clock },
            COMPLETED: { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
            CANCELLED: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
            ABSENT: { bg: '#fef3c7', color: '#92400e', icon: AlertCircle }
        };

        const config = styles[status] || styles.SCHEDULED;
        const Icon = config.icon;

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: config.bg,
                color: config.color,
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                <Icon size={12} />
                {status === 'SCHEDULED' ? 'Agendada' :
                 status === 'COMPLETED' ? 'Realizada' :
                 status === 'CANCELLED' ? 'Cancelada' : 'Faltou'}
            </span>
        );
    };

    const getTypeLabel = (type: string) => {
        const types: any = {
            MEDICAL: 'Médica',
            NURSING: 'Enfermagem',
            DENTAL: 'Odontológica',
            OTHER: 'Outra'
        };
        return types[type] || type;
    };

    if (isLoading) {
        return (
            <div className="container">
                <LoadingSpinner fullScreen message="Carregando consultas..." />
            </div>
        );
    }

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        Consultas Agendadas
                    </motion.h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Gerencie as consultas da unidade
                    </p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome do paciente..."
                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minWidth: '150px' }}
                >
                    <option value="ALL">Todos os Status</option>
                    <option value="SCHEDULED">Agendadas</option>
                    <option value="COMPLETED">Realizadas</option>
                    <option value="CANCELLED">Canceladas</option>
                    <option value="ABSENT">Faltou</option>
                </select>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minWidth: '150px' }}
                />
            </div>

            {filteredAppointments && filteredAppointments.length > 0 ? (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Data/Hora</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paciente</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tipo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Motivo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map((apt: any) => (
                                    <motion.tr
                                        key={apt.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                        whileHover={{ backgroundColor: 'var(--background)' }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={16} color="var(--primary)" />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                        {new Date(apt.scheduledDate).toLocaleDateString('pt-BR')}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(apt.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} color="var(--text-muted)" />
                                                <span style={{ fontWeight: 500 }}>{apt.patient?.fullName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {getTypeLabel(apt.type)}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {apt.reason || '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {getStatusBadge(apt.status)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => navigate(`/patients/${apt.patientId}`)}
                                                className="btn"
                                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                            >
                                                Ver Paciente
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={Calendar}
                    title="Nenhuma consulta encontrada"
                    description={searchTerm || statusFilter !== 'ALL' || dateFilter
                        ? "Tente ajustar os filtros ou termos de busca para encontrar consultas."
                        : "Não há consultas agendadas no momento."}
                />
            )}
        </div>
    );
}
