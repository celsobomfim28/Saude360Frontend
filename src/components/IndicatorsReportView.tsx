interface IndicatorsReportViewProps {
  data: any;
  reportType: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'GREEN': return '#10b981';
    case 'YELLOW': return '#f59e0b';
    case 'RED': return '#ef4444';
    default: return '#9ca3af';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'GREEN': return 'Em dia';
    case 'YELLOW': return 'Atenção';
    case 'RED': return 'Atrasado';
    default: return 'Sem dados';
  }
};

export default function IndicatorsReportView({ data, reportType }: IndicatorsReportViewProps) {
  if (!data) return null;

  const renderSummary = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
        Resumo
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Total
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {data.summary?.total || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Em Dia
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {data.summary?.byStatus?.green || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Atenção
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {data.summary?.byStatus?.yellow || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Atrasado
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {data.summary?.byStatus?.red || 0}
          </p>
        </div>
      </div>
    </div>
  );

  const renderIndicatorBadge = (label: string, status: string) => (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.25rem 0.75rem',
      backgroundColor: `${getStatusColor(status)}20`,
      borderRadius: '0.5rem',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(status),
      }} />
      <span style={{ fontSize: '0.75rem', fontWeight: '500', color: getStatusColor(status) }}>
        {label}: {getStatusLabel(status)}
      </span>
    </div>
  );

  const renderPatientsList = () => {
    const patients = data.patients || data.children || data.pregnant || [];
    
    return (
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Lista de Pacientes
        </h3>
        {patients.map((patient: any, index: number) => (
          <div key={index} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {patient.name}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {patient.age !== undefined && `${patient.age} anos • `}
                  {patient.ageMonths !== undefined && `${patient.ageMonths} meses • `}
                  {patient.microArea}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.entries(patient.indicators || {}).map(([key, value]) => 
                renderIndicatorBadge(key.toUpperCase(), value as string)
              )}
            </div>

            {patient.lastUpdate && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Última atualização: {new Date(patient.lastUpdate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {renderSummary()}
      {renderPatientsList()}
    </div>
  );
}
