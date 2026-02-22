import { useState } from 'react';
import {
    Target,
    AlertCircle,
    CheckCircle2,
    Info,
    X,
    User,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';

export default function Indicators() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
    const [showPatientListModal, setShowPatientListModal] = useState(false);
    const { user } = useAuthStore();

    // Filtrar por microárea se o usuário for ACS
    const microAreaId = user?.role === 'ACS' && user?.microArea?.id ? user.microArea.id : undefined;

    const { data: detailedIndicators, isLoading } = useQuery({
        queryKey: ['detailed-indicators', microAreaId],
        queryFn: async () => {
            const params: any = {};
            if (microAreaId) {
                params.microAreaId = microAreaId;
            }
            const response = await api.get('/management/detailed-indicators', { params });
            return response.data.data;
        }
    });

    const { data: priorityList } = useQuery({
        queryKey: ['priority-list', selectedIndicator, microAreaId],
        queryFn: async () => {
            const params: any = { indicatorId: selectedIndicator };
            if (microAreaId) {
                params.microAreaId = microAreaId;
            }
            const response = await api.get('/management/priority-list', { params });
            return response.data.data || [];
        },
        enabled: showPatientListModal && !!selectedIndicator
    });

    const indicatorDefinitions: Record<string, any> = {
        A1: { name: 'Mais Acesso à APS', goal: 90, category: 'acesso', categoryName: 'Mais Acesso' },
        B1: { name: 'Puericultura - 1ª Consulta', goal: 85, category: 'crianca', categoryName: 'Saúde da Criança' },
        B2: { name: 'Puericultura - 9 Consultas', goal: 80, category: 'crianca', categoryName: 'Saúde da Criança' },
        B3: { name: 'Antropometria Infantil', goal: 85, category: 'crianca', categoryName: 'Saúde da Criança' },
        B4: { name: 'Visitas ACS Criança', goal: 80, category: 'crianca', categoryName: 'Saúde da Criança' },
        B5: { name: 'Vacinas Completas', goal: 95, category: 'crianca', categoryName: 'Saúde da Criança' },
        C1: { name: 'Pré-Natal Completo', goal: 90, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        C2: { name: 'PA Gestante', goal: 85, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        C3: { name: 'Antropometria Gestante', goal: 85, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        C4: { name: 'Visitas ACS Gestante', goal: 80, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        C5: { name: 'Vacina dTpa', goal: 90, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        C6: { name: 'Exames Pré-Natal', goal: 95, category: 'gestante', categoryName: 'Saúde Materno-Infantil' },
        D1: { name: 'Consultas Diabetes', goal: 85, category: 'diabetes', categoryName: 'Diabetes' },
        D2: { name: 'PA Diabetes', goal: 85, category: 'diabetes', categoryName: 'Diabetes' },
        D3: { name: 'Antropometria Diabetes', goal: 80, category: 'diabetes', categoryName: 'Diabetes' },
        D4: { name: 'Visitas ACS Diabetes', goal: 75, category: 'diabetes', categoryName: 'Diabetes' },
        D5: { name: 'HbA1c', goal: 80, category: 'diabetes', categoryName: 'Diabetes' },
        D6: { name: 'Avaliação Pés', goal: 75, category: 'diabetes', categoryName: 'Diabetes' },
        E1: { name: 'Consultas Hipertensão', goal: 80, category: 'hipertensao', categoryName: 'Hipertensão' },
        E2: { name: 'PA Hipertensão', goal: 85, category: 'hipertensao', categoryName: 'Hipertensão' },
        E3: { name: 'Antropometria Hipertensão', goal: 80, category: 'hipertensao', categoryName: 'Hipertensão' },
        E4: { name: 'Visitas ACS Hipertensão', goal: 75, category: 'hipertensao', categoryName: 'Hipertensão' },
        'A-ELDERLY': { name: 'Consultas Idoso', goal: 75, category: 'idoso', categoryName: 'Saúde do Idoso' },
        'B-ELDERLY': { name: 'Antropometria Idoso', goal: 70, category: 'idoso', categoryName: 'Saúde do Idoso' },
        'C3-ELDERLY': { name: 'Visitas ACS Idoso', goal: 70, category: 'idoso', categoryName: 'Saúde do Idoso' },
        'D-ELDERLY': { name: 'Vacina Influenza', goal: 80, category: 'idoso', categoryName: 'Saúde do Idoso' },
        F1: { name: 'Polifarmácia', goal: 75, category: 'idoso', categoryName: 'Saúde do Idoso' },
        F2: { name: 'IVCF-20', goal: 70, category: 'idoso', categoryName: 'Saúde do Idoso' },
        G1: { name: 'Papanicolau', goal: 80, category: 'mulher', categoryName: 'Saúde da Mulher' },
        G2: { name: 'Mamografia', goal: 70, category: 'mulher', categoryName: 'Saúde da Mulher' },
        'B-WOMAN': { name: 'Vacina HPV', goal: 85, category: 'mulher', categoryName: 'Saúde da Mulher' },
        'C-WOMAN': { name: 'Saúde Sexual/Reprodutiva', goal: 75, category: 'mulher', categoryName: 'Saúde da Mulher' }
    };

    const categories = [
        { id: 'all', name: 'Todos', icon: '📊' },
        { id: 'acesso', name: 'Mais Acesso', icon: '🏥' },
        { id: 'crianca', name: 'Criança', icon: '👶' },
        { id: 'gestante', name: 'Gestante', icon: '🤰' },
        { id: 'diabetes', name: 'Diabetes', icon: '💉' },
        { id: 'hipertensao', name: 'Hipertensão', icon: '❤️' },
        { id: 'idoso', name: 'Idoso', icon: '👴' },
        { id: 'mulher', name: 'Mulher', icon: '👩' }
    ];

    const processIndicators = () => {
        if (!detailedIndicators) return [];
        return detailedIndicators.map((ind: any) => {
            const def = indicatorDefinitions[ind.id] || { name: ind.name, goal: 100, category: 'outros', categoryName: 'Outros' };
            const current = ind.percent || 0;
            return {
                ...ind,
                ...def,
                current,
                status: current >= def.goal ? 'success' : current >= (def.goal * 0.7) ? 'warning' : 'danger'
            };
        });
    };

    const indicators = processIndicators();
    const filteredIndicators = selectedCategory === 'all' 
        ? indicators 
        : indicators.filter((i: any) => i.category === selectedCategory);

    const totalIndicators = indicators.length;
    const successIndicators = indicators.filter((i: any) => i.status === 'success').length;
    const warningIndicators = indicators.filter((i: any) => i.status === 'warning').length;
    const dangerIndicators = indicators.filter((i: any) => i.status === 'danger').length;

    const handleOpenPatientList = (indicatorId: string) => {
        setSelectedIndicator(indicatorId);
        setShowPatientListModal(true);
    };

    if (isLoading) {
        return (
            <div className="container">
                <LoadingSpinner fullScreen message="Carregando indicadores..." />
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header */}
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Target size={32} color="var(--primary)" />
                    <h1 style={{ margin: 0 }}>Indicadores de Desempenho</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    Programa Brasil 360
                    {user?.role === 'ACS' && user?.microArea && (
                        <span style={{ 
                            marginLeft: '8px', 
                            padding: '4px 8px', 
                            backgroundColor: 'var(--primary)15', 
                            color: 'var(--primary)', 
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            {user.microArea.name}
                        </span>
                    )}
                </p>
            </header>

            {/* Summary Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalIndicators}</div>
                </div>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-green)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Atingidas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-green)' }}>{successIndicators}</div>
                </div>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-yellow)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Em Atenção</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-yellow)' }}>{warningIndicators}</div>
                </div>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-red)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Críticos</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-red)' }}>{dangerIndicators}</div>
                </div>
            </div>

            {/* Category Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem', 
                overflowX: 'auto',
                paddingBottom: '0.5rem'
            }}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: selectedCategory === cat.id ? 'var(--primary)10' : 'white',
                            color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text)',
                            fontWeight: selectedCategory === cat.id ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem'
                        }}
                    >
                        <span style={{ marginRight: '6px' }}>{cat.icon}</span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Indicators Grid */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                <AnimatePresence mode="popLayout">
                    {filteredIndicators.map((ind: any) => (
                        <motion.div
                            key={ind.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="card"
                            style={{
                                padding: '1.25rem',
                                cursor: 'pointer',
                                borderLeft: `4px solid ${
                                    ind.status === 'success' ? 'var(--status-green)' :
                                    ind.status === 'warning' ? 'var(--status-yellow)' :
                                    'var(--status-red)'
                                }`,
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => handleOpenPatientList(ind.id)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        {ind.id}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.3' }}>
                                        {ind.name}
                                    </div>
                                </div>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: `${
                                        ind.status === 'success' ? 'var(--status-green)' :
                                        ind.status === 'warning' ? 'var(--status-yellow)' :
                                        'var(--status-red)'
                                    }15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {ind.status === 'success' ? (
                                        <CheckCircle2 size={16} color="var(--status-green)" />
                                    ) : ind.status === 'warning' ? (
                                        <Info size={16} color="var(--status-yellow)" />
                                    ) : (
                                        <AlertCircle size={16} color="var(--status-red)" />
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.5rem' }}>
                                <div style={{ 
                                    fontSize: '1.75rem', 
                                    fontWeight: 800,
                                    color: ind.status === 'success' ? 'var(--status-green)' :
                                           ind.status === 'warning' ? 'var(--status-yellow)' :
                                           'var(--status-red)'
                                }}>
                                    {ind.current}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Meta: {ind.goal}%
                                </div>
                            </div>

                            <div style={{ 
                                width: '100%', 
                                height: '6px', 
                                backgroundColor: 'var(--background)', 
                                borderRadius: '3px',
                                overflow: 'hidden',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{
                                    width: `${Math.min(ind.current, 100)}%`,
                                    height: '100%',
                                    backgroundColor: ind.status === 'success' ? 'var(--status-green)' :
                                                   ind.status === 'warning' ? 'var(--status-yellow)' :
                                                   'var(--status-red)',
                                    transition: 'width 0.3s'
                                }} />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                {ind.green > 0 && (
                                    <span style={{ color: 'var(--status-green)' }}>
                                        ✓ {ind.green}
                                    </span>
                                )}
                                {ind.yellow > 0 && (
                                    <span style={{ color: 'var(--status-yellow)' }}>
                                        ⚠ {ind.yellow}
                                    </span>
                                )}
                                {ind.red > 0 && (
                                    <span style={{ color: 'var(--status-red)' }}>
                                        ✕ {ind.red}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredIndicators.length === 0 && (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Filter size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        Nenhum indicador encontrado nesta categoria
                    </p>
                </div>
            )}

            {/* Modal de Lista de Pacientes */}
            {showPatientListModal && selectedIndicator && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: '1rem'
                    }}
                    onClick={() => setShowPatientListModal(false)}
                >
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>
                                    {indicatorDefinitions[selectedIndicator]?.name || selectedIndicator}
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Pacientes que necessitam atenção
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPatientListModal(false)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!priorityList ? (
                            <LoadingSpinner message="Carregando pacientes..." />
                        ) : priorityList.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <CheckCircle2 size={48} color="var(--status-green)" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ margin: 0 }}>Todos os pacientes estão em dia com este indicador!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {priorityList.map((patient: any) => (
                                    <div 
                                        key={patient.id}
                                        style={{
                                            padding: '1rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <User size={20} color="white" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {patient.fullName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {patient.age} anos • {patient.microArea}
                                            </div>
                                            {patient.criticalIndicators && patient.criticalIndicators.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                    {patient.criticalIndicators.map((indicator: string, idx: number) => (
                                                        <span 
                                                            key={idx}
                                                            style={{
                                                                fontSize: '0.625rem',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#fee2e2',
                                                                color: '#991b1b',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {indicator}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
