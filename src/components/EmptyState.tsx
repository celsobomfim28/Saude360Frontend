import React from 'react';

interface EmptyStateProps {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                <Icon size={40} color="var(--text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>{title}</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                {description}
            </p>
            {action && (
                <button onClick={action.onClick} className="btn btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    );
}
