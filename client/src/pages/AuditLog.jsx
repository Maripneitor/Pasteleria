const AuditLog = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h2>Bitácora de Auditoría</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px' }}>Usuario</th>
                        <th style={{ padding: '10px' }}>Acción</th>
                        <th style={{ padding: '10px' }}>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '10px' }}>Juan Pérez</td>
                        <td style={{ padding: '10px' }}>Editó pedido #505</td>
                        <td style={{ padding: '10px' }}>Hace 5 min</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '10px' }}>Admin</td>
                        <td style={{ padding: '10px' }}>Cierro de caja</td>
                        <td style={{ padding: '10px' }}>Hace 1 hora</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default AuditLog;
