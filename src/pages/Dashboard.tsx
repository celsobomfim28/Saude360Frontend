import React from 'react';
import {
    Activity,
    Users,
    Calendar,
    ChevronRight,
    TrendingUp,
    AlertTriangle,
    Clock,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [filterType, setFilterType] = React.useState('unit');
    const [selectedId, setSelectedId] = React.useState('');

    // Se for ACS, trava na microárea dele
    React.useEffect(() => {
        if (user?.role === 'ACS' && user?.microArea?.id) {
            setFilterType('microArea');
            setSelectedId(user.microArea.id);
        }
    }, [user]);

    const { data: microAreas } = useQuery({
        queryKey: ['micro-areas'],
        queryFn: async () => {
            const response = await api.get('/management/micro-areas');
            return response.data.data;
        },
        enabled: user?.role !== 'ACS'
    });

    const { data: agents } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const response = await api.get('/management/agents');
            return response.data.data;
        },
        enabled: user?.role !== 'ACS'
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['management-stats', filterType, selectedId],
        queryFn: async () => {
            const params: any = {};
            if (filterType === 'microArea' && selectedId) params.microAreaId = selectedId;
            if (filterType === 'agent' && selectedId) params.agentId = selectedId;

            const response = await api.get('/management/stats', { params });
            return response.data.data;
        },
        enabled: filterType === 'unit' || (filterType !== 'unit' && !!selectedId)
    });

    const { data: priorityList, isLoading: priorityLoading } = useQuery({
        queryKey: ['priority-list', filterType, selectedId],
        queryFn: async () => {
            const params: any = {};
            if (filterType === 'microArea' && selectedId) params.microAreaId = selectedId;
            if (filterType === 'agent' && selectedId) params.agentId = selectedId;

            const response = await api.get('/management/priority-list', { params });
            return response.data.data;
        },
        enabled: filterType === 'unit' || (filterType !== 'unit' && !!selectedId)
    });

    if (statsLoading || priorityLoading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const indicatorData = [
        {
            name: 'Diabéticos',
            total: stats?.programs?.diabetes || 0,
            green: stats?.indicatorSummary?.diabetes?.find((i: any) => i.d1Status === 'GREEN')?._count || 0,
            yellow: stats?.indicatorSummary?.diabetes?.find((i: any) => i.d1Status === 'YELLOW')?._count || 0,
            red: stats?.indicatorSummary?.diabetes?.find((i: any) => i.d1Status === 'RED')?._count || 0,
        },
        {
            name: 'Hipertensos',
            total: stats?.programs?.hypertension || 0,
            green: stats?.indicatorSummary?.hypertension?.find((i: any) => i.e1Status === 'GREEN')?._count || 0,
            yellow: stats?.indicatorSummary?.hypertension?.find((i: any) => i.e1Status === 'YELLOW')?._count || 0,
            red: stats?.indicatorSummary?.hypertension?.find((i: any) => i.e1Status === 'RED')?._count || 0,
        },
        {
            name: 'Gestantes',
            total: stats?.programs?.pregnant || 0,
            green: stats?.indicatorSummary?.prenatal?.find((i: any) => i.c1Status === 'GREEN')?._count || 0,
            yellow: stats?.indicatorSummary?.prenatal?.find((i: any) => i.c1Status === 'YELLOW')?._count || 0,
            red: stats?.indicatorSummary?.prenatal?.find((i: any) => i.c1Status === 'RED')?._count || 0,
        },
        {
            name: 'Crianças',
            total: stats?.programs?.children || 0,
            green: stats?.indicatorSummary?.childcare?.find((i: any) => i.b1Status === 'GREEN')?._count || 0,
            yellow: stats?.indicatorSummary?.childcare?.find((i: any) => i.b1Status === 'YELLOW')?._count || 0,
            red: stats?.indicatorSummary?.childcare?.find((i: any) => i.b1Status === 'RED')?._count || 0,
        },
        {
            name: 'Idosos',
            total: stats?.programs?.elderly || 0,
            green: stats?.indicatorSummary?.elderly?.find((i: any) => i.f1Status === 'GREEN')?._count || 0,
            yellow: stats?.indicatorSummary?.elderly?.find((i: any) => i.f1Status === 'YELLOW')?._count || 0,
            red: stats?.indicatorSummary?.elderly?.find((i: any) => i.f1Status === 'RED')?._count || 0,
        }
    ];

    const hasIndicatorData = indicatorData.some(item => item.green > 0 || item.yellow > 0 || item.red > 0);
    const hasProgramData = indicatorData.some(item => item.total > 0);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        Olá, {user?.fullName.split(' ')[0]}
                    </motion.h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bem-vindo ao Painel de Gestão da Unidade Saúde 360</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user?.role !== 'ACS' && (
                        <div className="card glass" style={{ padding: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <select
                                className="input"
                                style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.875rem', border: 'none', background: 'transparent' }}
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setSelectedId('');
                                }}
                            >
                                <option value="unit">Unidade (Geral)</option>
                                <option value="microArea">Por Microárea</option>
                                <option value="agent">Por Agente (ACS)</option>
                            </select>

                            {filterType !== 'unit' && (
                                <select
                                    className="input"
                                    style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.875rem', border: 'none', background: 'var(--background)' }}
                                    value={selectedId}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                >
                                    <option value="">Selecionar...</option>
                                    {filterType === 'microArea' ? (
                                        microAreas?.map((ma: any) => (
                                            <option key={ma.id} value={ma.id}>M.Área {ma.name}</option>
                                        ))
                                    ) : (
                                        agents?.map((ag: any) => (
                                            <option key={ag.id} value={ag.id}>{ag.fullName}</option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>
                    )}

                    <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            {/* Mensagem quando filtro está selecionado mas sem item específico */}
            {((filterType === 'microArea' || filterType === 'agent') && !selectedId) ? (
                <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <AlertTriangle size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h2 style={{ margin: '0 0 0.5rem' }}>Selecione {filterType === 'microArea' ? 'uma Microárea' : 'um Agente'}</h2>
                    <p>Escolha {filterType === 'microArea' ? 'uma microárea' : 'um agente'} no filtro acima para visualizar os dados.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                        {[
                            { label: 'Pacientes Totais', value: stats?.totalPatients || 0, icon: Users, color: 'var(--primary)' },
                            { label: 'Gestantes', value: stats?.programs?.pregnant || 0, icon: Activity, color: 'var(--accent)' },
                            { label: 'Crianças (<2a)', value: stats?.programs?.children || 0, icon: Clock, color: 'var(--success)' },
                            { label: 'Hipertensos', value: stats?.programs?.hypertension || 0, icon: AlertTriangle, color: '#dc2626' },
                            { label: 'Diabéticos', value: stats?.programs?.diabetes || 0, icon: TrendingUp, color: '#0284c7' }
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ borderLeft: `4px solid ${stat.color}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{stat.label}</p>
                                        <h2 style={{ margin: '0.5rem 0' }}>{stat.value}</h2>
                                    </div>
                                    <div style={{ backgroundColor: `${stat.color}15`, padding: '10px', borderRadius: '12px' }}>
                                        <stat.icon color={stat.color} size={24} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Main Chart */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <h3>Saúde Populacional (Indicador Base)</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {hasIndicatorData ? 'Status das últimas consultas realizadas' : 'Distribuição de pacientes por programa'}
                    </p>
                    <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
                        {hasProgramData ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={indicatorData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    {hasIndicatorData ? (
                                        <>
                                            <Bar dataKey="green" stackId="a" fill="var(--status-green)" name="Em Dia" />
                                            <Bar dataKey="yellow" stackId="a" fill="var(--status-yellow)" name="Pendente" />
                                            <Bar dataKey="red" stackId="a" fill="var(--status-red)" radius={[4, 4, 0, 0]} name="Atrasado" />
                                        </>
                                    ) : (
                                        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Total de Pacientes" />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                                    Nenhum paciente cadastrado ainda.<br />
                                    Comece cadastrando pacientes para visualizar os dados.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Priority List */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Busca Ativa Prioritária</h3>
                        {priorityList && priorityList.length > 0 && (
                            <button 
                                onClick={() => navigate('/patients')}
                                className="btn" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                                Ver Todos
                            </button>
                        )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Pacientes com indicadores críticos (status vermelho)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {priorityList && priorityList.length > 0 ? (
                            priorityList.slice(0, 5).map((item: any) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => navigate(`/patients/${item.id}`)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '0.75rem', 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--border)', 
                                        background: 'var(--background)50', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--background)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--background)50';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <div className="status-dot red"></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{item.fullName}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                            M.Área {item.microArea} • {item.criticalIndicators.join(', ')}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} color="var(--text-muted)" />
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--status-green)15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Activity size={24} color="var(--status-green)" />
                                </div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Tudo em ordem!</p>
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>
                                    Nenhum paciente com indicadores críticos no momento.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
                </>
            )}
        </div>
    );
}
