import { useState, useEffect } from 'react';
import {
    Plus,
    Calendar,
    Eye,
    Search,
    Filter,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PatientModal from '../components/PatientModal';
import PatientActionsMenu from '../components/PatientActionsMenu';
import PatientFiltersModal, { type FilterValues } from '../components/PatientFiltersModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Patients() {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({});
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Se for ACS, aplicar filtro automático por microárea
    useEffect(() => {
        if (user?.role === 'ACS' && user?.microArea?.id) {
            setFilters(prev => ({
                ...prev,
                microAreaId: user.microArea!.id
            }));
        }
    }, [user]);

    // Tradução dos grupos prioritários
    const translateGroup = (group: string): string => {
        const translations: Record<string, string> = {
            'CHILD': 'Criança',
            'PREGNANT': 'Gestante',
            'POSTPARTUM': 'Puérpera',
            'HYPERTENSION': 'Hipertensão',
            'DIABETES': 'Diabetes',
            'ELDERLY': 'Idoso',
            'WOMAN': 'Mulher'
        };
        return translations[group] || group;
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['patients', page, searchTerm, filters],
        queryFn: async () => {
            try {
                const response = await api.get('/patients', {
                    params: {
                        page,
                        name: searchTerm,
                        limit: 10,
                        ...filters
                    }
                });
                return response.data;
            } catch (error) {
                console.error('Erro ao buscar pacientes:', error);
                return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
            }
        }
    });

    const handleApplyFilters = (newFilters: FilterValues) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
    };

    const patients = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Gestão de Pacientes</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {user?.role === 'ACS' 
                            ? `Pacientes da sua microárea (${user?.microArea?.name || 'Área não definida'})`
                            : 'Lista unificada de pacientes elegíveis da unidade'
                        }
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Cadastrar Paciente
                </button>
            </header>

            <PatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <PatientFiltersModal
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                onApply={handleApplyFilters}
                currentFilters={filters}
            />

            {/* Filters Bar */}
            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou CNS..."
                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsFiltersOpen(true)}
                    className="btn card"
                    style={{
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        gap: '8px',
                        position: 'relative',
                        backgroundColor: Object.keys(filters).length > 0 ? 'var(--primary)' : '',
                        color: Object.keys(filters).length > 0 ? 'white' : ''
                    }}
                >
                    <Filter size={18} />
                    Filtros
                    {Object.keys(filters).length > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {Object.keys(filters).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Status Legend */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Legenda do Status Geral:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="status-dot red"></div>
                    <span>Crítico (Vermelho)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="status-dot yellow"></div>
                    <span>Atenção (Amarelo)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="status-dot green"></div>
                    <span>Em Dia (Verde)</span>
                </div>
            </div>

            {/* Table Card */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {isLoading ? (
                    <LoadingSpinner message="Carregando pacientes..." />
                ) : patients.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Nenhum paciente encontrado"
                        description={searchTerm || Object.keys(filters).length > 0
                            ? "Tente ajustar os filtros ou termos de busca para encontrar pacientes."
                            : "Comece cadastrando o primeiro paciente da sua unidade."}
                        action={{
                            label: "Cadastrar Primeiro Paciente",
                            onClick: () => setIsModalOpen(true)
                        }}
                    />
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--background)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '1rem' }}>Paciente</th>
                                    <th>Grupos Prioritários</th>
                                    <th>Microárea</th>
                                    <th>Status Geral</th>
                                    <th>Última Consulta</th>
                                    <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.length > 0 ? (
                                    patients.map((patient: any) => (
                                        <tr key={patient.id} style={{ borderBottom: '1px solid var(--background)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                        {patient.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{patient.fullName}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.age} anos</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {patient.eligibilityGroups.map((g: string) => (
                                                        <span key={g} style={{ fontSize: '0.625rem', padding: '2px 8px', borderRadius: '20px', background: 'var(--primary)10', color: 'var(--primary)', fontWeight: 600 }}>
                                                            {translateGroup(g)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Area {patient.microArea.name}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        {patient.indicatorsSummary.red > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                <div className="status-dot red"></div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-red)' }}>
                                                                    {patient.indicatorsSummary.red}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {patient.indicatorsSummary.yellow > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                <div className="status-dot yellow"></div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-yellow)' }}>
                                                                    {patient.indicatorsSummary.yellow}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {patient.indicatorsSummary.green > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                <div className="status-dot green"></div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-green)' }}>
                                                                    {patient.indicatorsSummary.green}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {patient.indicatorsSummary.red === 0 && patient.indicatorsSummary.yellow === 0 && patient.indicatorsSummary.green === 0 && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem indicadores</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} color="var(--text-muted)" />
                                                    {patient.lastConsultation ? new Date(patient.lastConsultation).toLocaleDateString('pt-BR') : 'Sem registro'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <PatientActionsMenu
                                                        patientId={patient.id}
                                                        patientName={patient.fullName}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : null}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {patients.length > 0 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <p>Mostrando {patients.length} de {pagination.total || 0} pacientes</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                        className="btn card"
                                        style={{ padding: '6px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        disabled={page >= pagination.totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        className="btn card"
                                        style={{ padding: '6px 16px', cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page >= pagination.totalPages ? 0.5 : 1 }}
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}
