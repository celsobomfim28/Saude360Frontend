import { useState, useEffect } from 'react';
import { X, MapPin, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface MicroAreaModalProps {
    isOpen: boolean;
    onClose: () => void;
    microArea?: any;
}

export default function MicroAreaModal({ isOpen, onClose, microArea }: MicroAreaModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        acsId: ''
    });

    // Buscar lista de ACS disponíveis
    const { data: users } = useQuery({
        queryKey: ['users-acs'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data.data;
        },
        enabled: isOpen
    });

    // Filtrar apenas usuários com role ACS
    const acsUsers = users?.filter((user: any) => user.role === 'ACS') || [];

    const getAssignedAcsId = (area: any): string => {
        if (!area) return '';

        const assignedFromUsers = acsUsers.find((user: any) => {
            const userMicroAreaId = user?.microAreaId || user?.microArea?.id;
            return userMicroAreaId === area?.id;
        });

        if (assignedFromUsers?.id) return assignedFromUsers.id;

        const acsFromArray = Array.isArray(area?.acs) ? area.acs[0] : null;
        const acsFromObject = !Array.isArray(area?.acs) ? area?.acs : null;
        const acsFromAgent = area?.agent;
        const acsFromCommunityAgent = area?.communityAgent;
        const acsFromResponsible = area?.responsibleAcs;
        const acsFromUsers = Array.isArray(area?.users)
            ? area.users.find((user: any) => user?.role === 'ACS')
            : null;

        const assignedAcs =
            acsFromArray ||
            acsFromObject ||
            acsFromAgent ||
            acsFromCommunityAgent ||
            acsFromResponsible ||
            acsFromUsers;

        return assignedAcs?.id || assignedAcs?.userId || '';
    };

    useEffect(() => {
        if (microArea) {
            setFormData({
                name: microArea.name || '',
                code: microArea.code || '',
                description: microArea.description || '',
                acsId: getAssignedAcsId(microArea)
            });
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                acsId: ''
            });
        }
    }, [microArea, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            // Preparar dados para envio, removendo campos undefined
            const payload: any = {
                name: data.name,
                code: data.code,
            };

            // Adicionar apenas campos que têm valor
            if (data.description) {
                payload.description = data.description;
            }
            
            console.log('Enviando payload:', payload);
            console.log('Modo:', microArea ? 'Editar' : 'Criar');

            const microAreaResponse = microArea
                ? await api.put(`/management/micro-areas/${microArea.id}`, payload)
                : await api.post('/management/micro-areas', payload);

            const savedMicroAreaId =
                microArea?.id ||
                microAreaResponse?.data?.data?.id ||
                microAreaResponse?.data?.id;

            if (!savedMicroAreaId) {
                return microAreaResponse;
            }

            const currentlyAssignedAcs = acsUsers.filter((user: any) => {
                const userMicroAreaId = user?.microAreaId || user?.microArea?.id;
                return userMicroAreaId === savedMicroAreaId;
            });

            const selectedAcsId = data.acsId || null;

            // Remove vínculo de ACS anteriormente atribuídos à microárea, se necessário
            for (const assignedUser of currentlyAssignedAcs) {
                if (!selectedAcsId || assignedUser.id !== selectedAcsId) {
                    await api.put(`/users/${assignedUser.id}`, { microAreaId: null });
                }
            }

            // Vincula ACS selecionado à microárea via users.microAreaId
            if (selectedAcsId) {
                await api.put(`/users/${selectedAcsId}`, { microAreaId: savedMicroAreaId });
            }

            return microAreaResponse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro-areas'] });
            queryClient.invalidateQueries({ queryKey: ['users-acs'] });
            setFormData({ name: '', code: '', description: '', acsId: '' });
            onClose();
        },
        onError: (error: any) => {
            console.error('Erro completo:', error);
            console.error('Resposta do servidor:', error.response?.data);
            console.error('Mensagem de erro:', error.response?.data?.error?.message);
            console.error('Código de erro:', error.response?.data?.error?.code);
            console.error('Detalhes:', error.response?.data?.error?.details);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Erro ao salvar microárea');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card"
                style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--primary)15', color: 'var(--primary)' }}>
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                                {microArea ? 'Editar Microárea' : 'Nova Microárea'}
                            </h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {microArea ? 'Atualize as informações da microárea' : 'Cadastre uma nova microárea'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn" style={{ padding: '8px', backgroundColor: 'transparent' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Nome da Microárea <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: 01, 02, A, B"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            maxLength={10}
                        />
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Identificador curto da microárea (ex: 01, 02, A, B)
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Código <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: MA-001, AREA-01"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            maxLength={20}
                        />
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Código único para identificação no sistema
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Agente Comunitário de Saúde (ACS)
                        </label>
                        <select
                            value={formData.acsId}
                            onChange={(e) => setFormData({ ...formData, acsId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                        >
                            <option value="">Nenhum ACS atribuído</option>
                            {acsUsers.map((acs: any) => {
                                const acsMicroAreaId = acs?.microAreaId || acs?.microArea?.id;
                                const isAssignedToOther = acsMicroAreaId && (!microArea || acsMicroAreaId !== microArea.id);
                                return (
                                    <option key={acs.id} value={acs.id}>
                                        {acs.fullName} {isAssignedToOther ? `(já atribuído à M.Área ${acs?.microArea?.name || ''})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Selecione o ACS responsável por esta microárea
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Descrição
                        </label>
                        <textarea
                            placeholder="Descrição opcional da microárea, limites geográficos, características..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
                            maxLength={500}
                        />
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formData.description.length}/500 caracteres
                        </p>
                    </div>

                    {mutation.isError && (
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
                            Erro ao salvar microárea. Verifique os dados e tente novamente.
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            style={{ flex: 1, backgroundColor: 'var(--background)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Salvando...' : <><Save size={20} /> Salvar</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
