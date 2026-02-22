import React, { useState } from 'react';
import {
    AlertTriangle,
    Calendar,
    Users,
    Baby,
    Heart,
    Activity,
    UserCheck,
    ChevronRight,
    Loader2,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Alerts() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // Se for ACS, filtrar pela microárea dele
    const microAreaId = user?.role === 'ACS' ? user?.microArea?.id : undefined;

    const { data: priorityList, isLoading: priorityLoading } = useQuery({
        queryKey: ['priority-list', microAreaId],
        queryFn: async () => {
            const params: any = {};
            if (microAreaId) params.microAreaId = microAreaId;

            const response = await api.get('/management/priority-list', { params });
            return response.data.data;
        },
    });

    const { data: appointments, isLoading: appointmentsLoading } = useQuery({
        queryKey: ['upcoming-appointments', microAreaId],
        queryFn: async () => {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const params: any = {
                startDate: today.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                status: 'SCHEDULED',
            };
            if (microAreaId) params.microAreaId = microAreaId;

            const response = await api.get('/appointments', { params });
            return response.data.data;
        },
    });

    if (priorityLoading || appointmentsLoading) {
        return <LoadingSpinner fullScreen message="Carregando alertas..." />;
    }

    // Categorizar pacientes baseado nos indicadores críticos
    const categorizePatients = () => {
        if (!priorityList) return {};

        const categories: any = {
            ALL: priorityList,
            PREGNANT: [],
            CHILD: [],
            DIABETES: [],
            HYPERTENSION: [],
            ELDERLY: [],
            WOMAN: [],
        };

        priorityList.forEach((patient: any) => {
            // Verificar indicadores críticos para categorizar
            const indicators = patient.criticalIndicators || [];
            
            // Diabetes: D1, D2, D3, D4, D5, D6
            if (indicators.some((ind: string) => ind.startsWith('D'))) {
                categories.DIABETES.push(patient);
            }
            
            // Hipertensão: E1, E2, E3, E4
            if (indicators.some((ind: string) => ind.startsWith('E'))) {
                categories.HYPERTENSION.push(patient);
            }
            
            // Idosos: F1, F2
            if (indicators.some((ind: string) => ind.startsWith('F'))) {
                categories.ELDERLY.push(patient);
            }
            
            // Gestantes: C1, C2, C3, C4, C5, C6, C7
            if (indicators.some((ind: string) => ind.startsWith('C'))) {
                categories.PREGNANT.push(patient);
            }
            
            // Crianças: B1, B2, B3, B4, B5
            if (indicators.some((ind: string) => ind.startsWith('B'))) {
                categories.CHILD.push(patient);
            }
            
            // Saúde da Mulher: G1, G2, G3
            if (indicators.some((ind: string) => ind.startsWith('G'))) {
                categories.WOMAN.push(patient);
            }
        });

        return categories;
    };

    const categories = categorizePatients();

    const categoryFilters = [
        { key: 'ALL', label: 'Todos', icon: Users, color: 'var(--primary)', count: categories.ALL?.length || 0 },
        { key: 'PREGNANT', label: 'Gestantes', icon: Baby, color: '#f59e0b', count: categories.PREGNANT?.length || 0 },
        { key: 'CHILD', label: 'Crianças', icon: Baby, color: '#10b981', count: categories.CHILD?.length || 0 },
        { key: 'DIABETES', label: 'Diabetes', icon: Activity, color: '#8b5cf6', count: categories.DIABETES?.length || 0 },
        { key: 'HYPERTENSION', label: 'Hipertensão', icon: Heart, color: '#ef4444', count: categories.HYPERTENSION?.length || 0 },
        { key: 'ELDERLY', label: 'Idosos', icon: UserCheck, color: '#6b7280', count: categories.ELDERLY?.length || 0 },
        { key: 'WOMAN', label: 'Saúde da Mulher', icon: Users, color: '#ec4899', count: categories.WOMAN?.length || 0 },
    ];

    const filteredPatients = categories[selectedCategory] || [];

    const getAlertType = (patient: any) => {
        const indicators = patient.criticalIndicators || [];

        if (indicators.includes('C4') || indicators.includes('C1')) {
            return { type: 'Pré-natal', color: '#f59e0b', action: 'Visita ou consulta pendente' };
        }
        if (indicators.includes('B1') || indicators.includes('B2')) {
            return { type: 'Puericultura', color: '#10b981', action: 'Visita ou consulta pendente' };
        }
        if (indicators.includes('D4')) {
            return { type: 'Diabetes', color: '#8b5cf6', action: 'Visita domiciliar pendente' };
        }
        if (indicators.includes('E4')) {
            return { type: 'Hipertensão', color: '#ef4444', action: 'Visita domiciliar pendente' };
        }
        if (indicators.includes('F1')) {
            return { type: 'Idoso', color: '#6b7280', action: 'Visita domiciliar pendente' };
        }
        if (indicators.includes('G1') || indicators.includes('G2')) {
            return { type: 'Saúde da Mulher', color: '#ec4899', action: 'Exame preventivo pendente' };
        }
        return { type: 'Atenção', color: '#6b7280', action: 'Acompanhamento necessário' };
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <AlertTriangle size={32} style={{ display: 'inline', marginRight: '12px', color: 'var(--accent)' }} />
                    Alertas e Lembretes
                </motion.h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Pacientes que precisam de atenção e consultas programadas
                </p>
            </header>

            {/* Consultas Próximas */}
            {appointments && appointments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '2rem' }}
                >
                    <div className="card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <Calendar size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0 }}>Consultas nos Próximos 7 Dias</h2>
                            <span style={{
                                backgroundColor: 'var(--primary)',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}>
                                {appointments.length}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {appointments.slice(0, 5).map((apt: any) => (
                                <div
                                    key={apt.id}
                                    className="card"
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/patients/${apt.patient.id}`)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--primary)10',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {new Date(apt.scheduledDate).getDate()}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                {new Date(apt.scheduledDate).toLocaleDateString('pt-BR', { month: 'short' })}
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>
                                                {apt.patient?.fullName}
                                            </p>
                                            <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {apt.type} • {new Date(apt.scheduledDate).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                {apt.patient?.microArea?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>

                        {appointments.length > 5 && (
                            <button
                                className="btn"
                                style={{ marginTop: '1rem', width: '100%' }}
                                onClick={() => navigate('/appointments')}
                            >
                                Ver Todas as Consultas ({appointments.length})
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Filtros de Categoria */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={20} color="var(--text-muted)" />
                {categoryFilters.map((filter) => (
                    <button
                        key={filter.key}
                        className={`btn ${selectedCategory === filter.key ? 'btn-primary' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: selectedCategory === filter.key ? '' : 'var(--background)',
                            color: selectedCategory === filter.key ? '' : 'var(--text)',
                        }}
                        onClick={() => setSelectedCategory(filter.key)}
                    >
                        <filter.icon size={16} />
                        {filter.label}
                        {filter.count > 0 && (
                            <span style={{
                                backgroundColor: selectedCategory === filter.key ? '#fff' : filter.color,
                                color: selectedCategory === filter.key ? 'var(--primary)' : '#fff',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {filter.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Lista de Pacientes Prioritários */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="card">
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ margin: 0 }}>
                            Pacientes que Precisam de Atenção ({filteredPatients.length})
                        </h2>
                    </div>

                    {filteredPatients.length > 0 ? (
                        <div style={{ padding: '1rem' }}>
                            {filteredPatients.map((patient: any) => {
                                const alert = getAlertType(patient);
                                return (
                                    <div
                                        key={patient.id}
                                        className="card glass"
                                        style={{
                                            padding: '1rem',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderLeft: `4px solid ${alert.color}`
                                        }}
                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'var(--primary)10',
                                                    color: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '1.25rem'
                                                }}>
                                                    {patient.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>
                                                        {patient.fullName}
                                                    </p>
                                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        {patient.age} anos • {patient.microArea}
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '8px' }}>
                                                <span style={{
                                                    backgroundColor: `${alert.color}15`,
                                                    color: alert.color,
                                                    padding: '4px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600
                                                }}>
                                                    {alert.type}
                                                </span>
                                                <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    {alert.action}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {patient.criticalIndicators?.map((ind: string) => (
                                                    <span
                                                        key={ind}
                                                        style={{
                                                            backgroundColor: 'var(--danger)10',
                                                            color: 'var(--danger)',
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {ind}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <ChevronRight size={20} color="var(--text-muted)" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                            <h3>Tudo em dia!</h3>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Não há pacientes que precisam de atenção nesta categoria
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
