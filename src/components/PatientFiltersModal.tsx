import { useState, useEffect } from 'react';
import { X, Filter, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface FilterValues {
    microAreaId?: string;
    agentId?: string;
    eligibilityGroup?: string;
    status?: string;
    ageMin?: number;
    ageMax?: number;
}

interface PatientFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterValues) => void;
    currentFilters: FilterValues;
}

export default function PatientFiltersModal({ isOpen, onClose, onApply, currentFilters }: PatientFiltersModalProps) {
    const [filters, setFilters] = useState<FilterValues>(currentFilters);

    useEffect(() => {
        if (isOpen) {
            setFilters(currentFilters);
        }
    }, [isOpen, currentFilters]);

    const { data: microAreas } = useQuery({
        queryKey: ['micro-areas'],
        queryFn: async () => {
            const response = await api.get('/management/micro-areas');
            return response.data.data;
        },
        enabled: isOpen
    });

    const { data: agents } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const response = await api.get('/management/agents');
            return response.data.data;
        },
        enabled: isOpen
    });

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const emptyFilters: FilterValues = {};
        setFilters(emptyFilters);
        onApply(emptyFilters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)', padding: '1rem' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card"
                style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: 'var(--primary)10', padding: '10px', borderRadius: '12px' }}>
                            <Filter size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Filtros Avançados</h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Refine sua busca de pacientes</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Microárea */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Microárea</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            value={filters.microAreaId || ''}
                            onChange={(e) => setFilters({ ...filters, microAreaId: e.target.value || undefined })}
                        >
                            <option value="">Todas as microáreas</option>
                            {microAreas?.map((ma: any) => (
                                <option key={ma.id} value={ma.id}>
                                    {ma.name} - {ma.code}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Agente de Saúde */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Agente de Saúde (ACS)</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            value={filters.agentId || ''}
                            onChange={(e) => setFilters({ ...filters, agentId: e.target.value || undefined })}
                        >
                            <option value="">Todos os agentes</option>
                            {agents?.map((agent: any) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.fullName} {agent.microArea ? `- M.Área ${agent.microArea.name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grupo de Elegibilidade */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Grupo Prioritário</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            value={filters.eligibilityGroup || ''}
                            onChange={(e) => setFilters({ ...filters, eligibilityGroup: e.target.value || undefined })}
                        >
                            <option value="">Todos os grupos</option>
                            <option value="CHILD">Crianças (0-2 anos)</option>
                            <option value="PREGNANT">Gestantes</option>
                            <option value="POSTPARTUM">Puérperas</option>
                            <option value="HYPERTENSION">Hipertensos</option>
                            <option value="DIABETES">Diabéticos</option>
                            <option value="ELDERLY">Idosos (60+)</option>
                            <option value="WOMAN">Saúde da Mulher</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status do Paciente</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            value={filters.status || 'ACTIVE'}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="ACTIVE">Ativos</option>
                            <option value="INACTIVE">Inativos</option>
                        </select>
                    </div>

                    {/* Faixa Etária */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Faixa Etária</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Idade mínima"
                                    min="0"
                                    max="120"
                                    value={filters.ageMin || ''}
                                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value ? parseInt(e.target.value) : undefined })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Idade máxima"
                                    min="0"
                                    max="120"
                                    value={filters.ageMax || ''}
                                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value ? parseInt(e.target.value) : undefined })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--primary)05', border: '1px dashed var(--primary)30' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', lineHeight: 1.4 }}>
                            <strong>Dica:</strong> Combine múltiplos filtros para refinar ainda mais sua busca. Os filtros são aplicados em conjunto.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={handleClear} className="btn" style={{ background: 'var(--background)', color: 'var(--text)' }}>
                        Limpar Filtros
                    </button>
                    <button onClick={handleApply} className="btn btn-primary">
                        Aplicar Filtros
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
