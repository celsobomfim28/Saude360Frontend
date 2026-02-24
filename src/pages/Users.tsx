import { useState } from 'react';
import {
    UserPlus,
    Edit2,
    Trash2,
    Shield,
    Search,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function Users() {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        fullName: '',
        cpf: '',
        email: '',
        role: 'ACS',
        password: '',
        microAreaId: ''
    });

    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await api.get('/users');
                return response.data.data || [];
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
                return [];
            }
        }
    });

    const { data: microAreas } = useQuery({
        queryKey: ['micro-areas'],
        queryFn: async () => {
            const response = await api.get('/management/micro-areas');
            return response.data.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (userData: any) => {
            return await api.post('/users', userData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsAddingUser(false);
            setNewUser({ fullName: '', cpf: '', email: '', role: 'ACS', password: '', microAreaId: '' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            return await api.put(`/users/${updatedData.id}`, updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
        }
    });

    const filteredUsers = users?.filter((u: any) =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpf.includes(searchTerm)
    );

    return (
        <div className="container">
            <header className="page-header">
                <div>
                    <h1>Gestão de Equipe</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie os profissionais de saúde e seus acessos</p>
                </div>
                <div className="page-header-actions">
                    <button onClick={() => setIsAddingUser(true)} className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
                        <UserPlus size={20} />
                        Novo Profissional
                    </button>
                </div>
            </header>

            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.875rem', border: '1px solid var(--border)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {isLoading ? (
                    <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                    </div>
                ) : (
                    <>
                        <div className="desktop-only table-scroll">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--background)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <th style={{ padding: '1rem' }}>Profissional</th>
                                        <th>Cargo / Função</th>
                                        <th>Documento (CPF)</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!filteredUsers || filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                {searchTerm ? 'Nenhum profissional encontrado com esse critério de busca.' : 'Nenhum profissional cadastrado ainda.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user: any) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--background)' }}>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '12px',
                                                            backgroundColor: 'var(--primary)10',
                                                            color: 'var(--primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700
                                                        }}>
                                                            {user.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600 }}>{user.fullName}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email || 'Sem e-mail'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Shield size={14} color="var(--primary)" />
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.role}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.cpf}</span>
                                                </td>
                                                <td>
                                                    {user.isActive ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            <CheckCircle size={14} /> Ativo
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            <XCircle size={14} /> Inativo
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setEditingUser(user)}
                                                            className="btn"
                                                            style={{ padding: '8px', color: 'var(--primary)', backgroundColor: 'var(--primary)10' }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="btn" style={{ padding: '8px', color: 'var(--danger)', backgroundColor: 'var(--danger)10' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mobile-only mobile-card-list">
                            {!filteredUsers || filteredUsers.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                    {searchTerm ? 'Nenhum profissional encontrado com esse critério de busca.' : 'Nenhum profissional cadastrado ainda.'}
                                </p>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <div key={`mobile-${user.id}`} className="mobile-card">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                backgroundColor: 'var(--primary)10',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700
                                            }}>
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700 }}>{user.fullName}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email || 'Sem e-mail'}</p>
                                            </div>
                                        </div>

                                        <div className="mobile-card-row">
                                            <span className="mobile-card-label">Função</span>
                                            <span>{user.role}</span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span className="mobile-card-label">CPF</span>
                                            <span>{user.cpf}</span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span className="mobile-card-label">Status</span>
                                            {user.isActive ? (
                                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>Ativo</span>
                                            ) : (
                                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Inativo</span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="btn"
                                                style={{ flex: 1, color: 'var(--primary)', backgroundColor: 'var(--primary)10' }}
                                            >
                                                <Edit2 size={16} /> Editar
                                            </button>
                                            <button className="btn" style={{ flex: 1, color: 'var(--danger)', backgroundColor: 'var(--danger)10' }}>
                                                <Trash2 size={16} /> Inativar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="modal-shell" style={{ zIndex: 100 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="card modal-card"
                            style={{ maxWidth: '500px', padding: '2rem' }}
                        >
                            <h2 style={{ marginBottom: '1.5rem' }}>Editar Profissional</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateMutation.mutate(editingUser);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome Completo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editingUser.fullName}
                                        onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>E-mail</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={editingUser.email || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div className="form-grid cols-2">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Papel (Permissão)</label>
                                        <select
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        >
                                            <option value="ACS">ACS</option>
                                            <option value="TECNICO_ENFERMAGEM">Técnico Enfermagem</option>
                                            <option value="ENFERMEIRO">Enfermeiro</option>
                                            <option value="MEDICO">Médico</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                    {editingUser.role === 'ACS' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Microárea</label>
                                            <select
                                                value={editingUser.microAreaId || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, microAreaId: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                            >
                                                <option value="">Nenhuma</option>
                                                {microAreas?.map((ma: any) => (
                                                    <option key={ma.id} value={ma.id}>M.Área {ma.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div style={{}}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status</label>
                                        <select
                                            value={editingUser.isActive ? 'true' : 'false'}
                                            onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'true' })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        >
                                            <option value="true">Ativo</option>
                                            <option value="false">Inativo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nova Senha (deixe em branco para não alterar)</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Digite a nova senha se desejar alterar"
                                        value={editingUser.password || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="btn"
                                        style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ justifyContent: 'center' }}
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Add User Modal */}
            <AnimatePresence>
                {isAddingUser && (
                    <div className="modal-shell" style={{ zIndex: 100 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="card modal-card"
                            style={{ maxWidth: '500px', padding: '2rem' }}
                        >
                            <h2 style={{ marginBottom: '1.5rem' }}>Cadastrar Novo Profissional</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                createMutation.mutate(newUser);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome Completo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={newUser.fullName}
                                        onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div className="form-grid cols-2">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>CPF</label>
                                        <input
                                            type="text"
                                            className="input"
                                            required
                                            value={newUser.cpf}
                                            onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Senha</label>
                                        <input
                                            type="password"
                                            className="input"
                                            required
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>E-mail</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div className="form-grid cols-2">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Papel (Permissão)</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        >
                                            <option value="ACS">ACS</option>
                                            <option value="TECNICO_ENFERMAGEM">Técnico Enfermagem</option>
                                            <option value="ENFERMEIRO">Enfermeiro</option>
                                            <option value="MEDICO">Médico</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                    {newUser.role === 'ACS' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Microárea</label>
                                            <select
                                                value={newUser.microAreaId}
                                                onChange={(e) => setNewUser({ ...newUser, microAreaId: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                            >
                                                <option value="">Nenhuma</option>
                                                {microAreas?.map((ma: any) => (
                                                    <option key={ma.id} value={ma.id}>M.Área {ma.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingUser(false)}
                                        className="btn"
                                        style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ justifyContent: 'center' }}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Finalizar Cadastro'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
