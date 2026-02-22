import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, FileText, Calendar, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AppointmentModal from './AppointmentModal';
import HomeVisitModal from './HomeVisitModal';

interface PatientActionsMenuProps {
    patientId: string;
    patientName: string;
}

export default function PatientActionsMenu({ patientId, patientName }: PatientActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isHomeVisitModalOpen, setIsHomeVisitModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/patients/${patientId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            setIsOpen(false);
        },
        onError: (error: any) => {
            alert(error.response?.data?.error?.message || 'Erro ao inativar paciente');
        }
    });

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja inativar o paciente ${patientName}? Esta ação pode ser revertida posteriormente.`)) {
            deleteMutation.mutate();
        }
    };

    const menuItems = [
        {
            icon: Edit,
            label: 'Editar Cadastro',
            onClick: () => {
                navigate(`/patients/${patientId}/edit`);
                setIsOpen(false);
            },
            color: 'var(--text)'
        },
        {
            icon: Calendar,
            label: 'Agendar Consulta',
            onClick: () => {
                setIsAppointmentModalOpen(true);
                setIsOpen(false);
            },
            color: 'var(--primary)'
        },
        {
            icon: Home,
            label: 'Registrar Visita',
            onClick: () => {
                setIsHomeVisitModalOpen(true);
                setIsOpen(false);
            },
            color: 'var(--accent)'
        },
        {
            icon: FileText,
            label: 'Ver Documentos',
            onClick: () => {
                navigate(`/patients/${patientId}`);
                setIsOpen(false);
            },
            color: 'var(--text-muted)'
        },
        {
            icon: Trash2,
            label: 'Inativar Paciente',
            onClick: handleDelete,
            color: '#dc2626',
            divider: true
        }
    ];

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s'
                }}
                title="Opções"
            >
                <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="card shadow-lg"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 8px)',
                            minWidth: '220px',
                            padding: '0.5rem',
                            zIndex: 1000,
                            border: '1px solid var(--border)'
                        }}
                    >
                        {menuItems.map((item, index) => (
                            <div key={index}>
                                {item.divider && (
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                )}
                                <button
                                    onClick={item.onClick}
                                    disabled={deleteMutation.isPending}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: item.color,
                                        transition: 'background 0.2s',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--background)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'none';
                                    }}
                                >
                                    <item.icon size={16} />
                                    {item.label}
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AppointmentModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                patientId={patientId}
                patientName={patientName}
            />

            <HomeVisitModal
                isOpen={isHomeVisitModalOpen}
                onClose={() => setIsHomeVisitModalOpen(false)}
                patientId={patientId}
                patientName={patientName}
            />
        </div>
    );
}
