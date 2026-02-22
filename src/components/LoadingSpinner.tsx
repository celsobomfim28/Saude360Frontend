import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    fullScreen?: boolean;
    message?: string;
}

export default function LoadingSpinner({ size = 48, fullScreen = false, message }: LoadingSpinnerProps) {
    const content = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: fullScreen ? '0' : '4rem'
        }}>
            <Loader2 className="animate-spin" size={size} color="var(--primary)" />
            {message && (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 9999
            }}>
                {content}
            </div>
        );
    }

    return content;
}
