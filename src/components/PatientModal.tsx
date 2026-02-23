import { useState, useEffect } from 'react';
import { X, Loader2, Save, User, MapPin, ClipboardList, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { extractApiErrorMessage, notify } from '../utils/notifications';

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PatientModal({ isOpen, onClose }: PatientModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [canSubmit, setCanSubmit] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        cpf: '',
        cns: '',
        birthDate: '',
        sex: 'FEMALE',
        motherName: '',
        primaryPhone: '',
        secondaryPhone: '',
        email: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            zipCode: '',
            referencePoint: ''
        },
        microAreaId: '',
        eligibilityCriteria: {
            isChild: false,
            isPregnant: false,
            lastMenstrualDate: '',
            isPostpartum: false,
            hasHypertension: false,
            hasDiabetes: false,
            isElderly: false,
            isWoman: false
        }
    });

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCanSubmit(false);
        }
    }, [isOpen]);

    const { data: microAreas } = useQuery({
        queryKey: ['micro-areas'],
        queryFn: async () => {
            const response = await api.get('/management/micro-areas');
            return response.data.data;
        },
        enabled: isOpen
    });

    const mutation = useMutation({
        mutationFn: async (payload: typeof formData) => {
            return await api.post('/patients', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            notify.success('Paciente cadastrado com sucesso!');
            onClose();
        },
        onError: (error: any) => {
            const errorData = error.response?.data?.error;
            if (errorData?.code === 'VALIDATION_ERROR' && errorData?.details) {
                // Format validation errors
                const errorMessages = errorData.details
                    .map((err: any) => `${err.field}: ${err.message}`)
                    .join('\n');
                notify.error(`Erros de validação:\n${errorMessages}`);
            } else {
                notify.error(extractApiErrorMessage(error, 'Erro ao cadastrar paciente.'));
            }
        }
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
    };

    const handleEligibilityChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            eligibilityCriteria: { ...prev.eligibilityCriteria, [field]: value }
        }));
    };

    const isUnderTwoYearsOld = (birthDate: string) => {
        if (!birthDate) return false;

        const [year, month, day] = birthDate.split('-').map(Number);
        if (!year || !month || !day) return false;

        const birthUtc = Date.UTC(year, month - 1, day);
        const now = new Date();
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

        const twoYearsInMs = 2 * 365.25 * 24 * 60 * 60 * 1000;
        return (todayUtc - birthUtc) < twoYearsInMs;
    };

    const isElderlyByBirthDate = (birthDate: string) => {
        if (!birthDate) return false;

        const [year, month, day] = birthDate.split('-').map(Number);
        if (!year || !month || !day) return false;

        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        const currentDay = now.getUTCDate();

        let age = currentYear - year;
        if (currentMonth < month || (currentMonth === month && currentDay < day)) {
            age -= 1;
        }

        return age >= 60;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit called, current step:', step, 'canSubmit:', canSubmit);
        
        // Prevent submission if not on final step OR if user didn't explicitly click submit
        if (step !== 3 || !canSubmit) {
            console.log('Preventing submit - step:', step, 'canSubmit:', canSubmit);
            return;
        }
        
        console.log('On step 3 and canSubmit is true, proceeding with submission');
        
        // Validate required fields
        if (!formData.fullName || !formData.birthDate) {
            notify.warning('Preencha Nome Completo e Data de Nascimento.');
            return;
        }
        
        if (!formData.microAreaId || !formData.address.street || !formData.address.number || !formData.address.neighborhood) {
            notify.warning('Preencha os campos obrigatórios do endereço e microárea.');
            return;
        }
        
        const computedIsChild = isUnderTwoYearsOld(formData.birthDate);
        const computedIsElderly = isElderlyByBirthDate(formData.birthDate);
        const menstrualDateIso =
            formData.eligibilityCriteria.isPregnant && formData.eligibilityCriteria.lastMenstrualDate
                ? new Date(formData.eligibilityCriteria.lastMenstrualDate + 'T12:00:00.000Z').toISOString()
                : undefined;

        const payloadEligibilityCriteria: any = {
            isChild: computedIsChild,
            isPregnant: formData.eligibilityCriteria.isPregnant,
            isPostpartum: formData.eligibilityCriteria.isPostpartum,
            hasHypertension: formData.eligibilityCriteria.hasHypertension,
            hasDiabetes: formData.eligibilityCriteria.hasDiabetes,
            isElderly: computedIsElderly,
            isWoman: formData.eligibilityCriteria.isWoman
        };

        if (menstrualDateIso) {
            payloadEligibilityCriteria.lastMenstrualDate = menstrualDateIso;
        }

        // Format data before sending
        const payload = {
            ...formData,
            // Convert date to ISO datetime with Z timezone
            birthDate: formData.birthDate ? new Date(formData.birthDate + 'T12:00:00.000Z').toISOString() : '',
            // Remove non-digits from CPF and phones
            cpf: formData.cpf.replace(/\D/g, ''),
            primaryPhone: formData.primaryPhone ? formData.primaryPhone.replace(/\D/g, '') : '',
            secondaryPhone: formData.secondaryPhone ? formData.secondaryPhone.replace(/\D/g, '') : '',
            // Ensure optional fields are sent as empty strings if not filled
            cns: formData.cns || '',
            motherName: formData.motherName || '',
            email: formData.email || '',
            address: {
                ...formData.address,
                complement: formData.address.complement || '',
                zipCode: formData.address.zipCode ? formData.address.zipCode.replace(/\D/g, '') : '',
                referencePoint: formData.address.referencePoint || ''
            },
            eligibilityCriteria: payloadEligibilityCriteria
        };
        
        console.log('Payload being sent:', JSON.stringify(payload, null, 2));
        setCanSubmit(false); // Reset flag
        mutation.mutate(payload);
    };

    const handleNextStep = () => {
        console.log('handleNextStep called, current step:', step);
        setStep(s => {
            console.log('Setting step from', s, 'to', s + 1);
            return s + 1;
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent form submission on Enter key if not on final step
        if (e.key === 'Enter' && step !== 3) {
            e.preventDefault();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)', padding: '1rem' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card"
                style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: 'var(--primary)10', padding: '10px', borderRadius: '12px' }}>
                            <User size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Novo Cadastro de Paciente</h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Passo {step} de 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', background: 'var(--background)', width: '100%' }}>
                    <motion.div
                        style={{ height: '100%', background: 'var(--primary)' }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} style={{ padding: '2rem' }}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <User size={16} /> Dados Identificadores
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome Completo</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome da Mãe</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.motherName} onChange={e => handleInputChange('motherName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>CPF (opcional)</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} placeholder="000.000.000-00" value={formData.cpf} onChange={e => handleInputChange('cpf', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>CNS (Cartão SUS)</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} placeholder="000 0000 0000 0000" value={formData.cns} onChange={e => handleInputChange('cns', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Data de Nascimento</label>
                                        <input type="date" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sexo</label>
                                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.sex} onChange={e => handleInputChange('sex', e.target.value)}>
                                            <option value="FEMALE">Feminino</option>
                                            <option value="MALE">Masculino</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem' }}>
                                    <Phone size={16} /> Contato
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Telefone Principal</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.primaryPhone} onChange={e => handleInputChange('primaryPhone', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Telefone Secundário</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.secondaryPhone} onChange={e => handleInputChange('secondaryPhone', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>E-mail</label>
                                        <input type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <MapPin size={16} /> Localização e Vínculo
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Microárea de Atendimento</label>
                                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.microAreaId} onChange={e => handleInputChange('microAreaId', e.target.value)}>
                                            <option value="">Selecione a microárea...</option>
                                            {microAreas?.map((ma: any) => (
                                                <option key={ma.id} value={ma.id}>{ma.name} - {ma.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Logradouro (Rua, Avenida, etc.)</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.address.street} onChange={e => handleAddressChange('street', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Número</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.address.number} onChange={e => handleAddressChange('number', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bairro</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.address.neighborhood} onChange={e => handleAddressChange('neighborhood', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>CEP</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.address.zipCode} onChange={e => handleAddressChange('zipCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ponto de Referência</label>
                                        <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.address.referencePoint} onChange={e => handleAddressChange('referencePoint', e.target.value)} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <ClipboardList size={16} /> Critérios de Inclusão (Elegibilidade)
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.eligibilityCriteria.hasHypertension} onChange={e => handleEligibilityChange('hasHypertension', e.target.checked)} />
                                            Pessoa com Hipertensão (HAS)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.eligibilityCriteria.hasDiabetes} onChange={e => handleEligibilityChange('hasDiabetes', e.target.checked)} />
                                            Pessoa com Diabetes (DM)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.eligibilityCriteria.isPregnant} onChange={e => handleEligibilityChange('isPregnant', e.target.checked)} />
                                            Gestante
                                        </label>
                                        {formData.eligibilityCriteria.isPregnant && (
                                            <div style={{ paddingLeft: '1.5rem', marginTop: '-0.5rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>DUM (Data p/ Menstruação)</label>
                                                <input type="date" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }} value={formData.eligibilityCriteria.lastMenstrualDate} onChange={e => handleEligibilityChange('lastMenstrualDate', e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.eligibilityCriteria.isPostpartum} onChange={e => handleEligibilityChange('isPostpartum', e.target.checked)} />
                                            Puérpera (até 45 dias)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.eligibilityCriteria.isWoman} onChange={e => handleEligibilityChange('isWoman', e.target.checked)} />
                                            Saúde da Mulher (Ppreventivo)
                                        </label>
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--primary)05', borderRadius: '8px', border: '1px dashed var(--primary)30' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', lineHeight: 1.4 }}>
                                                <strong>Nota:</strong> Critérios de idade (Criança/Idoso) são calculados automaticamente pela data de nascimento.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)' }}>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Ao clicar em <strong>Finalizar Cadastro</strong>, o paciente será vinculado à sua equipe de saúde e seus indicadores começarão a ser monitorados.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        {step > 1 && (
                            <button type="button" onClick={() => setStep(s => s - 1)} className="btn" style={{ background: 'var(--background)', color: 'var(--text)' }}>
                                Voltar
                            </button>
                        )}
                        {step < 3 ? (
                            <button type="button" onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
                                Próximo Passo
                            </button>
                        ) : (
                            <button type="submit" onClick={() => setCanSubmit(true)} className="btn btn-primary" style={{ padding: '0.875rem 2.5rem', gap: '10px' }} disabled={mutation.isPending}>
                                {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Finalizar Cadastro</>}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
