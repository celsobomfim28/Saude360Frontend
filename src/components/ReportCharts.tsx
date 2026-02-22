import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: any[];
  type: 'bar' | 'line' | 'pie';
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  colors?: string[];
}

const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ReportChart({ data, type, dataKey = 'value', xAxisKey = 'name', title, colors = COLORS }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: 'var(--text-muted)',
        backgroundColor: 'var(--background)',
        borderRadius: '0.5rem'
      }}>
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      {title && (
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: 'var(--text)'
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], r: 4 }}
            />
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de produção da equipe
export function TeamProductionChart({ data }: { data: any[] }) {
  const chartData = data.map(item => ({
    name: item.professional,
    Visitas: item.visits,
    Antropometria: item.anthropometry,
    'Pressão Arterial': item.bloodPressure,
    Vacinas: item.vaccines,
  }));

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        marginBottom: '1rem',
        color: 'var(--text)'
      }}>
        Produção por Profissional
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Legend />
          <Bar dataKey="Visitas" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Antropometria" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Pressão Arterial" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Vacinas" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de distribuição de risco
export function RiskDistributionChart({ data }: { data: { high: number; medium: number; low: number } }) {
  const chartData = [
    { name: 'Alto Risco', value: data.high, color: '#ef4444' },
    { name: 'Médio Risco', value: data.medium, color: '#f59e0b' },
    { name: 'Baixo Risco', value: data.low, color: '#10b981' },
  ];

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        marginBottom: '1rem',
        color: 'var(--text)'
      }}>
        Distribuição por Nível de Risco
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de evolução temporal
export function TimelineChart({ data, dataKey, title }: { data: any[]; dataKey: string; title: string }) {
  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        marginBottom: '1rem',
        color: 'var(--text)'
      }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke="#1e3a8a" 
            strokeWidth={2}
            dot={{ fill: '#1e3a8a', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
