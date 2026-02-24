import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import MicroAreaModal from '../components/MicroAreaModal';

export default function MicroAreas() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMicroArea, setEditingMicroArea] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: microAreas, isLoading } = useQuery({
        queryKey: ['micro-areas'],
        queryFn: async () => {
            const response = await api.get('/management/micro-areas');
            return response.data.data;
        }
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data.data || [];
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/management/micro-areas/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro-areas'] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error?.message || 'Erro ao excluir microárea');
        }
    });

    const handleEdit = (microArea: any) => {
        setEditingMicroArea(microArea);
        setIsModalOpen(true);
    };

    const handleDelete = (microArea: any) => {
        if (window.confirm(`Tem certeza que deseja excluir a microárea ${microArea.name}? Esta ação não pode ser desfeita.`)) {
            deleteMutation.mutate(microArea.id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMicroArea(null);
    };

    const getAssignedAcsName = (microArea: any): string => {
        const assignedAcsFromUsers = users?.find((user: any) => {
            if (user?.role !== 'ACS') return false;

            const userMicroAreaId = user?.microAreaId || user?.microArea?.id;
            return userMicroAreaId === microArea?.id;
        });

        if (assignedAcsFromUsers?.fullName) return assignedAcsFromUsers.fullName;

        // fallback para compatibilidade com possíveis formatos antigos
        const acsFromArray = Array.isArray(microArea?.acs) ? microArea.acs[0] : null;
        const acsFromObject = !Array.isArray(microArea?.acs) ? microArea?.acs : null;
        const acsFromAgent = microArea?.agent;
        const acsFromCommunityAgent = microArea?.communityAgent;
        const acsFromResponsible = microArea?.responsibleAcs;

        const assignedAcs = acsFromArray || acsFromObject || acsFromAgent || acsFromCommunityAgent || acsFromResponsible;

        return assignedAcs?.fullName || assignedAcs?.name || 'Não atribuído';
    };

    if (isLoading) {
        return (
            <div className="container">
                <LoadingSpinner fullScreen message="Carregando microáreas..." />
            </div>
        );
    }

    return (
        <div className="container">
            <header className="page-header">
                <div>
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        Gestão de Microáreas
                    </motion.h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Gerencie as microáreas da unidade de saúde
                    </p>
                </div>
                <div className="page-header-actions">
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        <Plus size={20} />
                        Nova Microárea
                    </button>
                </div>
            </header>

            <MicroAreaModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                microArea={editingMicroArea}
            />

            {microAreas && microAreas.length > 0 ? (
                <div className="responsive-cards-grid">
                    {microAreas.map((microArea: any) => (
                        <motion.div
                            key={microArea.id}
                            className="card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -4 }}
                            style={{ borderTop: '4px solid var(--primary)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--primary)15',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)',
                                        fontWeight: 700,
                                        fontSize: '1.25rem'
                                    }}>
                                        {microArea.name}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Microárea {microArea.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Código: {microArea.code}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {microArea.description && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    {microArea.description}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <Users size={14} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pacientes</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {microArea._count?.patients || 0}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <MapPin size={14} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACS</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                        {getAssignedAcsName(microArea)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(microArea)}
                                    className="btn"
                                    style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '0.875rem' }}
                                >
                                    <Edit size={16} />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(microArea)}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontSize: '0.875rem',
                                        backgroundColor: '#fee2e2',
                                        color: '#991b1b'
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 size={16} />
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={MapPin}
                    title="Nenhuma microárea cadastrada"
                    description="Comece cadastrando a primeira microárea da unidade"
                    action={{
                        label: "Cadastrar Microárea",
                        onClick: () => setIsModalOpen(true)
                    }}
                />
            )}
        </div>
    );
}
