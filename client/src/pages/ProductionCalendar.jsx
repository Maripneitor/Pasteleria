const ProductionCalendar = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h2>Calendario de Producción</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                marginTop: '20px'
            }}>
                {/* Header */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} style={{ fontWeight: 'bold', textAlign: 'center' }}>{day}</div>
                ))}

                {/* Days */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} style={{
                        border: '1px solid var(--border-color)',
                        height: '100px',
                        padding: '5px',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{i + 1}</span>
                        {i === 5 && <div style={{ background: 'var(--accent-color)', color: 'white', fontSize: '0.7rem', padding: '2px', borderRadius: '2px', marginTop: '5px' }}>3 Pasteles</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductionCalendar;
