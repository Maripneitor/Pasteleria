import styles from './DashboardHome.module.css';

const DashboardHome = () => {
    return (
        <div className={styles.dashboard}>
            <h2>Dashboard</h2>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Ventas Hoy</h3>
                    <p className={styles.statValue}>$12,500</p>
                    <span className={styles.trend}>▲ 15% vs ayer</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Pedidos Pendientes</h3>
                    <p className={styles.statValue}>8</p>
                    <span className={styles.trend}>⚠️ 2 para hoy</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Producción</h3>
                    <p className={styles.statValue}>12</p>
                    <span className={styles.trend}>Pasteles en horno</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Usuarios Activos</h3>
                    <p className={styles.statValue}>5</p>
                    <span className={styles.trend}>En turno</span>
                </div>
            </div>

            <div className={styles.chartsSection}>
                <div className={styles.chartContainer}>
                    <h3>Ventas Semanales</h3>
                    <div className={styles.placeholderChart}>[Gráfica de Barras]</div>
                </div>
                <div className={styles.chartContainer}>
                    <h3>Pedidos por Estado</h3>
                    <div className={styles.placeholderChart}>[Gráfica de Pastel]</div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
