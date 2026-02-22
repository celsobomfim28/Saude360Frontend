import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Settings,
    LogOut,
    Stethoscope,
    Calendar,
    MapPin,
    AlertTriangle,
    Syringe,
    FlaskConical,
    Bell,
    BarChart3,
    Map,
    Brain,
    Video,
    FileText,
    Sun,
    Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '../stores/authStore';
import { useNotificationToasts, useUnreadCount } from '../hooks/useNotifications';
import { useThemeStore } from '../stores/themeStore';

export default function RootLayout() {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const unreadCount = useUnreadCount();

    useNotificationToasts();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Visão Geral', to: '/', icon: LayoutDashboard },
        { label: 'Pacientes', to: '/patients', icon: Users },
        { label: 'Consultas', to: '/appointments', icon: Calendar },
        { label: 'Alertas', to: '/alerts', icon: AlertTriangle },
        { label: 'Notificações', to: '/notifications', icon: Bell },
        { label: 'Vacinas', to: '/vaccines', icon: Syringe },
        { label: 'Exames', to: '/lab-exams', icon: FlaskConical },
        { label: 'Relatórios', to: '/reports', icon: FileText },
        { label: 'Indicadores', to: '/indicators', icon: ClipboardList },
        { label: 'Dashboard', to: '/dashboard-period', icon: BarChart3 },
        { label: 'Territorialização', to: '/territorialization', icon: Map },
        { label: 'Análise Preditiva', to: '/predictive', icon: Brain },
        { label: 'Telemedicina', to: '/telemedicine', icon: Video },
        { label: 'Configurações', to: '/settings', icon: Settings },
    ];

    if (user?.role === 'ADMIN') {
        navItems.splice(11, 0, { label: 'Microáreas', to: '/micro-areas', icon: MapPin });
        navItems.splice(12, 0, { label: 'Equipe', to: '/users', icon: Stethoscope });
    }

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside className="glass" style={{ width: '280px', height: '100vh', position: 'sticky', top: 0, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
                    <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)' }}>
                        <Stethoscope color="white" size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary)', letterSpacing: '-0.025em' }}>Saúde 360</h2>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unidade PSF</p>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '0.625rem 0.625rem',
                                borderRadius: '0.625rem',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                                boxShadow: isActive ? '0 4px 12px rgba(30, 58, 138, 0.2)' : 'none',
                                position: 'relative'
                            })}
                        >
                            <item.icon size={18} />
                            {item.label}
                            {item.to === '/notifications' && unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    right: '0.875rem',
                                    backgroundColor: 'var(--danger)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '0.125rem 0.4rem',
                                    borderRadius: '9999px',
                                    minWidth: '18px',
                                    textAlign: 'center'
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <button
                        onClick={toggleTheme}
                        className="btn"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            backgroundColor: 'var(--card-soft)',
                            color: 'var(--text)',
                            marginBottom: '0.75rem'
                        }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                            {initials}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user?.fullName.split(' ')[0]}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn"
                        style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', backgroundColor: 'transparent' }}
                    >
                        <LogOut size={20} />
                        Sair do Sistema
                    </button>
                </div>
            </aside >

            {/* Main Content */}
            < main style={{ flex: 1, backgroundColor: 'var(--background)' }
            }>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={window.location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main >
        </div >
    );
}
