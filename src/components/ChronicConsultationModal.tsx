import { useState } from 'react';
import {
    X,
    Stethoscope,
    Activity,
    Scale,
    Save,
    ClipboardCheck,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface ChronicConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    type: 'HYPERTENSION' | 'DIABETES';
}

export default function ChronicConsultationModal({ isOpen, onClose, patientId, patientName, type }: ChronicConsultationModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<any>({
        consultationDate: new Date().toISOString().split('T')[0],
        systolicBP: '',
        diastolicBP: '',
        glucose: '',
        glucoseType: 'FASTING',
        hba1c: '',
        footExamPerformed: false,
        footExamResult: '',
        weight: '',
        height: '',
        medicationAdherence: true,
        observations: ''
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const endpoint = type === 'HYPERTENSION' ? '/hypertension' : '/diabetes';
            return await api.post(endpoint, {
                ...data,
                patientId,
                // Convert numeric strings to numbers
                systolicBP: data.systolicBP ? parseInt(data.systolicBP) : undefined,
                diastolicBP: data.diastolicBP ? parseInt(data.diastolicBP) : undefined,
                glucose: data.glucose ? parseFloat(data.glucose) : undefined,
                hba1c: data.hba1c ? parseFloat(data.hba1c) : undefined,
                weight: data.weight ? parseFloat(data.weight) : undefined,
                height: data.height ? parseFloat(data.height) : undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
            queryClient.invalidateQueries({ queryKey: ['management-stats'] });
            queryClient.invalidateQueries({ queryKey: ['detailed-indicators'] });
            onClose();
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
                style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--primary)15', color: 'var(--primary)' }}>
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Nova Consulta: {type === 'HYPERTENSION' ? 'Hipertensão' : 'Diabetes'}</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paciente: {patientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn" style={{ padding: '8px', backgroundColor: 'transparent' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><Activity size={18} color="var(--primary)" /> Dados Vitais</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Data da Consulta</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.consultationDate}
                                    onChange={(e) => setFormData({ ...formData, consultationDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                />
                            </div>
                        </div>

                        {type === 'HYPERTENSION' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>PA Sistólica (mmHg)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 120"
                                        required
                                        value={formData.systolicBP}
                                        onChange={(e) => setFormData({ ...formData, systolicBP: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>PA Diastólica (mmHg)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 80"
                                        required
                                        value={formData.diastolicBP}
                                        onChange={(e) => setFormData({ ...formData, diastolicBP: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>
                            </div>
                        )}

                        {type === 'DIABETES' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Glicemia (mg/dL)</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 95"
                                            value={formData.glucose}
                                            onChange={(e) => setFormData({ ...formData, glucose: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tipo</label>
                                        <select
                                            value={formData.glucoseType}
                                            onChange={(e) => setFormData({ ...formData, glucoseType: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                        >
                                            <option value="FASTING">Jejum</option>
                                            <option value="POSTPRANDIAL">Pós-Prandial</option>
                                            <option value="CASUAL">Casual</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>HbA1c (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Ex: 5.8"
                                            value={formData.hba1c}
                                            onChange={(e) => setFormData({ ...formData, hba1c: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.footExamPerformed}
                                                onChange={(e) => setFormData({ ...formData, footExamPerformed: e.target.checked })}
                                            />
                                            Avaliação dos Pés feita?
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    <section>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><Scale size={18} color="var(--primary)" /> Antropometria</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Peso (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ex: 75.5"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Altura (cm)</label>
                                <input
                                    type="number"
                                    placeholder="Ex: 172"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><ClipboardCheck size={18} color="var(--primary)" /> Conduta e Observações</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={formData.medicationAdherence}
                                    onChange={(e) => setFormData({ ...formData, medicationAdherence: e.target.checked })}
                                />
                                Está seguindo a medicação prescrita?
                            </label>
                        </div>
                        <div>
                            <textarea
                                placeholder="Evolução clínica, novos sintomas ou ajustes de medicação..."
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
                            ></textarea>
                        </div>
                    </section>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: 'var(--background)' }}>Cancelar</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Salvando...' : <><Save size={20} /> Salvar Ficha</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
