import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, User, AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

export default function Login() {
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const { theme, toggleTheme } = useThemeStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { cpf, password });
            const { user, token } = response.data;

            login(user, token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
            <button
                onClick={toggleTheme}
                className="btn"
                style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'var(--card)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                }}
            >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Claro' : 'Escuro'}
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card gap"
                style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        backgroundColor: 'var(--primary)',
                        padding: '12px',
                        borderRadius: '16px',
                        marginBottom: '1rem',
                        boxShadow: '0 8px 16px rgba(30, 58, 138, 0.2)'
                    }}>
                        <Stethoscope color="white" size={32} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Saúde 360 PSF</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Entre com suas credenciais para acessar o painel administrativo</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            backgroundColor: 'var(--danger)10',
                            color: 'var(--danger)',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--danger)30'
                        }}
                    >
                        <AlertCircle size={18} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>CPF</label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none' }}
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.5rem' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : 'Entrar no Sistema'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Acesso restrito a profissionais de saúde autorizados. Esse sistema é monitorado.
                </p>
            </motion.div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    );
}
