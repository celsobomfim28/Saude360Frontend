import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickStatsProps {
    stats: Array<{
        label: string;
        value: number | string;
        icon: LucideIcon;
        color: string;
        trend?: {
            value: number;
            isPositive: boolean;
        };
    }>;
}

export default function QuickStats({ stats }: QuickStatsProps) {
    return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ borderLeft: `4px solid ${stat.color}` }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{stat.label}</p>
                            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800 }}>{stat.value}</h2>
                        </div>
                        <div style={{ backgroundColor: `${stat.color}15`, padding: '10px', borderRadius: '12px', height: 'fit-content' }}>
                            <stat.icon color={stat.color} size={24} />
                        </div>
                    </div>
                    {stat.trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span style={{ color: stat.trend.isPositive ? 'var(--success)' : 'var(--danger)' }}>
                                {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>vs. mês anterior</span>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
