import { useState } from 'react';
import { X, Home, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface HomeVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export default function HomeVisitModal({ isOpen, onClose, patientId, patientName }: HomeVisitModalProps) {
    const queryClient = useQueryClient();
    const toIsoNoon = (dateStr: string) => `${dateStr}T12:00:00.000Z`;
    const isValidDateInput = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !Number.isNaN(new Date(`${dateStr}T12:00:00.000Z`).getTime());
    const [formData, setFormData] = useState({
        visitDate: new Date().toISOString().split('T')[0],
        visitType: 'ROUTINE',
        wasPerformed: true,
        reasonNotPerformed: '',
        observations: '',
        healthEducation: false,
        environmentalAssessment: false,
        referralMade: false,
        // Procedimentos
        weight: '',
        height: '',
        systolicBP: '',
        diastolicBP: '',
        glucose: ''
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const visitDateTime = toIsoNoon(data.visitDate);
            
            // Construir observações com procedimentos
            let fullObservations = data.observations || '';
            const procedures = [];
            if (data.weight) procedures.push(`Peso: ${data.weight}kg`);
            if (data.height) procedures.push(`Altura: ${data.height}cm`);
            if (data.systolicBP && data.diastolicBP) procedures.push(`PA: ${data.systolicBP}/${data.diastolicBP}mmHg`);
            if (data.glucose) procedures.push(`Glicemia: ${data.glucose}mg/dL`);
            
            if (procedures.length > 0) {
                fullObservations += (fullObservations ? '\n\n' : '') + 'Procedimentos realizados:\n' + procedures.join('\n');
            }
            
            await api.post('/home-visits', {
                patientId,
                visitDate: visitDateTime,
                visitType: data.visitType,
                purpose: `Visita domiciliar ${data.visitType === 'ROUTINE' ? 'de rotina' : data.visitType.toLowerCase()}`,
                wasPerformed: data.wasPerformed,
                reasonNotPerformed: data.wasPerformed ? null : data.reasonNotPerformed,
                observations: fullObservations,
                healthEducation: data.healthEducation,
                environmentalAssessment: data.environmentalAssessment,
                referralMade: data.referralMade
            });

            const anthropometryPayload =
                data.weight && data.height
                    ? {
                        patientId,
                        measurementDate: visitDateTime,
                        weight: parseFloat(data.weight),
                        height: parseFloat(data.height),
                        observations: data.observations || undefined
                    }
                    : null;

            const bloodPressurePayload =
                data.systolicBP && data.diastolicBP
                    ? {
                        patientId,
                        measurementDate: visitDateTime,
                        systolicBP: parseInt(data.systolicBP),
                        diastolicBP: parseInt(data.diastolicBP),
                        observations: data.observations || undefined
                    }
                    : null;

            if (anthropometryPayload) {
                await api.post('/shared-actions/anthropometry', anthropometryPayload);
            }
            if (bloodPressurePayload) {
                await api.post('/shared-actions/blood-pressure', bloodPressurePayload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
            queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
            setFormData({
                visitDate: new Date().toISOString().split('T')[0],
                visitType: 'ROUTINE',
                wasPerformed: true,
                reasonNotPerformed: '',
                observations: '',
                healthEducation: false,
                environmentalAssessment: false,
                referralMade: false,
                weight: '',
                height: '',
                systolicBP: '',
                diastolicBP: '',
                glucose: ''
            });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidDateInput(formData.visitDate)) {
            alert('Informe uma data válida no formato AAAA-MM-DD.');
            return;
        }

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
                            <Home size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Registrar Visita Domiciliar</h2>
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
                                Data da Visita
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.visitDate}
                                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                max={new Date().toISOString().split('T')[0]}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            />
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Aceita registro retroativo (data real da visita).
                            </p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Tipo de Visita
                            </label>
                            <select
                                required
                                value={formData.visitType}
                                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            >
                                <option value="ROUTINE">Rotina</option>
                                <option value="PRIORITY">Prioritária</option>
                                <option value="FOLLOW_UP">Acompanhamento</option>
                                <option value="EMERGENCY">Emergência</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={formData.wasPerformed}
                                onChange={(e) => setFormData({ ...formData, wasPerformed: e.target.checked })}
                            />
                            Visita foi realizada?
                        </label>
                    </div>

                    {!formData.wasPerformed && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Motivo da Não Realização
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Paciente ausente, Endereço não localizado, etc."
                                value={formData.reasonNotPerformed}
                                onChange={(e) => setFormData({ ...formData, reasonNotPerformed: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                            />
                        </div>
                    )}

                    {formData.wasPerformed && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Atividades Realizadas</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.healthEducation}
                                        onChange={(e) => setFormData({ ...formData, healthEducation: e.target.checked })}
                                    />
                                    Educação em Saúde
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.environmentalAssessment}
                                        onChange={(e) => setFormData({ ...formData, environmentalAssessment: e.target.checked })}
                                    />
                                    Avaliação Ambiental
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.referralMade}
                                        onChange={(e) => setFormData({ ...formData, referralMade: e.target.checked })}
                                    />
                                    Encaminhamento Realizado
                                </label>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    Procedimentos (Opcional)
                                </label>
                                <div className="modal-grid-2">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            Peso (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Ex: 70.5"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            Altura (cm)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Ex: 165"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            PA Sistólica (mmHg)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 120"
                                            value={formData.systolicBP}
                                            onChange={(e) => setFormData({ ...formData, systolicBP: e.target.value })}
                                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            PA Diastólica (mmHg)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 80"
                                            value={formData.diastolicBP}
                                            onChange={(e) => setFormData({ ...formData, diastolicBP: e.target.value })}
                                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            Glicemia (mg/dL)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 95"
                                            value={formData.glucose}
                                            onChange={(e) => setFormData({ ...formData, glucose: e.target.value })}
                                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Observações
                        </label>
                        <textarea
                            placeholder="Descreva as atividades realizadas, condições encontradas, orientações dadas..."
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                    </div>

                    {mutation.isError && (
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}>
                            Erro ao registrar visita. Tente novamente.
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
                            {mutation.isPending ? 'Salvando...' : <><Save size={20} /> Salvar</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
