import { useState } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Database,
    Save,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function Settings() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.put(`/users/${user?.id}`, data);
        },
        onSuccess: () => {
            alert('Perfil atualizado com sucesso!');
            setProfileData({ ...profileData, currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error?.message || 'Erro ao atualizar perfil');
        }
    });

    const handleSaveProfile = () => {
        if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
            alert('As senhas não coincidem');
            return;
        }

        const updateData: any = {
            fullName: profileData.fullName,
            email: profileData.email
        };

        if (profileData.newPassword) {
            updateData.password = profileData.newPassword;
        }

        updateProfileMutation.mutate(updateData);
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        Configurações
                    </motion.h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Gerencie suas preferências e configurações do sistema
                    </p>
                </div>
            </header>

            <div className="grid" style={{ gridTemplateColumns: '250px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Sidebar Tabs */}
                <aside className="card" style={{ padding: '0.5rem' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {[
                            { id: 'profile', label: 'Meu Perfil', icon: User },
                            { id: 'notifications', label: 'Notificações', icon: Bell },
                            { id: 'security', label: 'Segurança', icon: Shield },
                            { id: 'system', label: 'Sistema', icon: Database }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
                                style={{
                                    justifyContent: 'flex-start',
                                    gap: '12px',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: activeTab === tab.id ? '' : 'transparent',
                                    color: activeTab === tab.id ? '' : 'var(--text-muted)'
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main>
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                        >
                            <h3 style={{ marginBottom: '1.5rem' }}>Informações do Perfil</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        E-mail
                                    </label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        CPF
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.cpf || ''}
                                        disabled
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'not-allowed' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', margin: 0 }}>
                                        O CPF não pode ser alterado
                                    </p>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        Cargo/Função
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.role || ''}
                                        disabled
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

                                <h4 style={{ marginBottom: '0.5rem' }}>Alterar Senha</h4>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Digite a nova senha"
                                        value={profileData.newPassword}
                                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        Confirmar Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Confirme a nova senha"
                                        value={profileData.confirmPassword}
                                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    className="btn btn-primary"
                                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Salvar Alterações
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                        >
                            <h3 style={{ marginBottom: '1rem' }}>Preferências de Notificações</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                Configure como você deseja receber notificações do sistema
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Notificações de Consultas Agendadas', description: 'Receba alertas sobre consultas próximas' },
                                    { label: 'Alertas de Indicadores Críticos', description: 'Seja notificado quando indicadores estiverem em vermelho' },
                                    { label: 'Lembretes de Visitas Domiciliares', description: 'Receba lembretes de visitas pendentes' },
                                    { label: 'Notificações de Novos Pacientes', description: 'Seja informado sobre novos cadastros na sua área' }
                                ].map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</p>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</p>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                            <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'var(--primary)',
                                                transition: '0.4s',
                                                borderRadius: '26px'
                                            }}></span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                        >
                            <h3 style={{ marginBottom: '1.5rem' }}>Segurança e Privacidade</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Sessões Ativas</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Você está conectado neste dispositivo
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'var(--background)' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Navegador Atual</p>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Último acesso: {new Date().toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }}>
                                            Ativo
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Histórico de Acessos</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                        Funcionalidade em desenvolvimento
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'system' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                        >
                            <h3 style={{ marginBottom: '1.5rem' }}>Informações do Sistema</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', margin: 0 }}>Versão do Sistema</p>
                                            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>5.1.2</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', margin: 0 }}>Última Atualização</p>
                                            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>15/02/2026</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', margin: 0 }}>Ambiente</p>
                                            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>Desenvolvimento</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', margin: 0 }}>API Status</p>
                                            <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: '#166534' }}>Conectado</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Sobre o Saúde 360 PSF</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                                        Sistema de gestão e trabalho de campo para equipes de Saúde da Família (eSF), 
                                        focado no cumprimento dos indicadores do programa Brasil 360.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
}
