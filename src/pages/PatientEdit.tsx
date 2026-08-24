import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PatientEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({
    fullName: '',
    cpf: '',
    cns: '',
    birthDate: '',
    sex: 'MALE',
    motherName: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    zipCode: '',
    referencePoint: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    eligibilityCriteria: {
      isPregnant: false,
      isPostpartum: false,
      lastMenstrualDate: '',
      hasHypertension: false,
      hasDiabetes: false,
    },
  });

  // Buscar dados do paciente
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/patients/${id}`);
        if (!response.data || !response.data.data) {
          throw new Error('Dados do paciente não encontrados');
        }
        return response.data.data;
      } catch (error: any) {
        console.error('Erro ao buscar paciente:', error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
  });

  // Preencher formulário quando os dados chegarem
  useEffect(() => {
    if (patient) {
      setFormData({
        fullName: patient.fullName || '',
        cpf: patient.cpf || '',
        cns: patient.cns || '',
        birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
        sex: patient.sex || 'MALE',
        motherName: patient.motherName || '',
        street: patient.address?.street || '',
        number: patient.address?.number || '',
        complement: patient.address?.complement || '',
        neighborhood: patient.address?.neighborhood || '',
        zipCode: patient.address?.zipCode || '',
        referencePoint: patient.address?.referencePoint || '',
        primaryPhone: patient.primaryPhone || '',
        secondaryPhone: patient.secondaryPhone || '',
        email: patient.email || '',
        eligibilityCriteria: {
          isPregnant: Boolean(patient.isPregnant),
          isPostpartum: Boolean(patient.isPostpartum),
          lastMenstrualDate: patient.lastMenstrualDate ? patient.lastMenstrualDate.split('T')[0] : '',
          hasHypertension: Boolean(patient.hasHypertension),
          hasDiabetes: Boolean(patient.hasDiabetes),
        },
      });
    }
  }, [patient]);

  // Mutation para atualizar paciente
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/patients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      alert('Paciente atualizado com sucesso!');
      navigate(`/patients/${id}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Erro ao atualizar paciente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const onlyDigits = (value?: string) => (value || '').replace(/\D/g, '');
    const eligibility = formData.eligibilityCriteria;

    if (eligibility.isPregnant && !eligibility.lastMenstrualDate) {
      alert('Informe a DUM para paciente gestante.');
      return;
    }

    // Montar payload compatível com o schema do backend
    const dataToSend: any = {
      fullName: formData.fullName,
      cpf: onlyDigits(formData.cpf),
      cns: onlyDigits(formData.cns),
      birthDate: formData.birthDate ? new Date(`${formData.birthDate}T00:00:00.000Z`).toISOString() : undefined,
      sex: formData.sex,
      motherName: formData.motherName,
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement || '',
        neighborhood: formData.neighborhood,
        zipCode: onlyDigits(formData.zipCode),
        referencePoint: formData.referencePoint || '',
      },
      primaryPhone: onlyDigits(formData.primaryPhone),
      secondaryPhone: onlyDigits(formData.secondaryPhone),
      email: formData.email || '',
      microAreaId: patient?.microArea?.id,
      eligibilityCriteria: {
        isChild: Boolean(patient?.isChild),
        isPregnant: eligibility.isPregnant,
        isPostpartum: eligibility.isPostpartum,
        hasHypertension: eligibility.hasHypertension,
        hasDiabetes: eligibility.hasDiabetes,
        isElderly: Boolean(patient?.isElderly),
        isWoman: Boolean(patient?.isWoman),
        ...(eligibility.isPregnant && eligibility.lastMenstrualDate
          ? { lastMenstrualDate: new Date(`${eligibility.lastMenstrualDate}T12:00:00.000Z`).toISOString() }
          : {}),
      },
    };
    
    updateMutation.mutate(dataToSend);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEligibilityChange = (field: string, value: boolean | string) => {
    setFormData((prev: any) => {
      const current = prev.eligibilityCriteria;
      const next = { ...current, [field]: value };

      // Após o parto, a paciente deixa o grupo de gestantes e passa a ser acompanhada no puerpério.
      if (field === 'isPostpartum' && value) {
        next.isPregnant = false;
        next.lastMenstrualDate = '';
      }
      if (field === 'isPregnant' && value) {
        next.isPostpartum = false;
      }

      return { ...prev, eligibilityCriteria: next };
    });
  };

  if (isLoading) {
    return (
      <div className="container">
        <LoadingSpinner fullScreen message="Carregando dados do paciente..." />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--status-red)', marginBottom: '1rem' }}>
            {error ? 'Erro ao carregar dados do paciente' : 'Paciente não encontrado'}
          </p>
          <button onClick={() => navigate('/patients')} className="btn btn-primary">
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="btn"
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            Editar Cadastro
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Atualize as informações do paciente {patient.fullName}
          </p>
        </div>
      </header>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form onSubmit={handleSubmit}>
          {/* Dados Pessoais */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              Dados Pessoais
            </h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  disabled
                  className="input"
                  style={{ width: '100%', backgroundColor: 'var(--background)' }}
                  title="CPF não pode ser alterado"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  CNS *
                </label>
                <input
                  type="text"
                  name="cns"
                  value={formData.cns}
                  onChange={handleChange}
                  required
                  disabled
                  className="input"
                  style={{ width: '100%', backgroundColor: 'var(--background)' }}
                  title="CNS não pode ser alterado"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Sexo *
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Nome da Mãe *
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              Endereço
            </h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Rua *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Número *
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Complemento
                </label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Bairro *
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  CEP *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  name="referencePoint"
                  value={formData.referencePoint}
                  onChange={handleChange}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              Contato
            </h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Telefone Principal *
                </label>
                <input
                  type="tel"
                  name="primaryPhone"
                  value={formData.primaryPhone}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Telefone Secundário
                </label>
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleChange}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Critérios de elegibilidade */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              Critérios de Elegibilidade
            </h3>
            <p style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Ao registrar o parto, desmarque “Gestante” e marque “Puérpera”. A paciente permanece ativa para acompanhamento por até 45 dias.
            </p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.eligibilityCriteria.hasHypertension}
                  onChange={(e) => handleEligibilityChange('hasHypertension', e.target.checked)}
                />
                Pessoa com Hipertensão (HAS)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.eligibilityCriteria.hasDiabetes}
                  onChange={(e) => handleEligibilityChange('hasDiabetes', e.target.checked)}
                />
                Pessoa com Diabetes (DM)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.eligibilityCriteria.isPregnant}
                  onChange={(e) => handleEligibilityChange('isPregnant', e.target.checked)}
                  disabled={formData.sex !== 'FEMALE'}
                />
                Gestante
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.eligibilityCriteria.isPostpartum}
                  onChange={(e) => handleEligibilityChange('isPostpartum', e.target.checked)}
                  disabled={formData.sex !== 'FEMALE'}
                />
                Puérpera (até 45 dias)
              </label>
              {formData.eligibilityCriteria.isPregnant && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    DUM (Data da Última Menstruação) *
                  </label>
                  <input
                    type="date"
                    value={formData.eligibilityCriteria.lastMenstrualDate}
                    onChange={(e) => handleEligibilityChange('lastMenstrualDate', e.target.value)}
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => navigate(`/patients/${id}`)}
              className="btn"
              disabled={updateMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
