import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndicatorCardProps {
    id: string;
    name: string;
    current: number;
    goal: number;
    status: 'success' | 'warning' | 'danger';
    trend?: 'up' | 'down';
    isSelected?: boolean;
    onClick?: () => void;
}

export default function IndicatorCard({
    id,
    name,
    current,
    goal,
    status,
    trend = 'up',
    isSelected = false,
    onClick
}: IndicatorCardProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'success': return 'var(--status-green)';
            case 'warning': return 'var(--status-yellow)';
            case 'danger': return 'var(--status-red)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <motion.div
            whileHover={{ x: 5 }}
            onClick={onClick}
            className="card"
            style={{
                cursor: 'pointer',
                borderLeft: `4px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                backgroundColor: isSelected ? 'var(--background)' : '',
                padding: '1.25rem',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {id}
                </span>
                {trend === 'up' ? (
                    <TrendingUp size={16} color="var(--success)" />
                ) : (
                    <TrendingDown size={16} color="var(--danger)" />
                )}
            </div>
            
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>{name}</h4>
            
            <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--border)',
                borderRadius: '3px',
                overflow: 'hidden'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(current, 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                        height: '100%',
                        backgroundColor: getStatusColor()
                    }}
                />
            </div>
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                <span style={{ color: getStatusColor() }}>{current}%</span>
                <span style={{ color: 'var(--text-muted)' }}>Meta: {goal}%</span>
            </div>
        </motion.div>
    );
}
