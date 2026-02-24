import { useState } from 'react';
import { X, Calendar, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export default function AppointmentModal({ isOpen, onClose, patientId, patientName }: AppointmentModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        scheduledDate: '',
        scheduledTime: '',
        type: 'MEDICAL',
        reason: '',
        observations: ''
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const scheduledDateTime = `${data.scheduledDate}T${data.scheduledTime}:00.000Z`;
            return await api.post('/appointments', {
                patientId,
                scheduledDate: scheduledDateTime,
                type: data.type,
                reason: data.reason,
                observations: data.observations
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
            queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
            setFormData({
                scheduledDate: '',
                scheduledTime: '',
                type: 'MEDICAL',
                reason: '',
                observations: ''
            });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-shell">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card modal-card"
                style={{ maxWidth: '500px', padding: '1.25rem' }}
            >
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--primary)15', color: 'var(--primary)' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Agendar Consulta</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paciente: {patientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn" style={{ padding: '8px', backgroundColor: 'transparent' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="modal-grid-2">
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Data
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Horário
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Tipo de Consulta
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                        >
                            <option value="MEDICAL">Médica</option>
                            <option value="NURSING">Enfermagem</option>
                            <option value="DENTAL">Odontológica</option>
                            <option value="OTHER">Outra</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Motivo
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Consulta de rotina, Retorno, etc."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Observações
                        </label>
                        <textarea
                            placeholder="Informações adicionais..."
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                    </div>

                    {mutation.isError && (
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
                            Erro ao agendar consulta. Tente novamente.
                        </div>
                    )}

                    <div className="modal-actions">
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
                            {mutation.isPending ? 'Agendando...' : <><Save size={20} /> Agendar</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
