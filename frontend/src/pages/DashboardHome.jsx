import styles from './DashboardHome.module.css';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto

const DashboardHome = () => {
    const { user } = useAuth(); // Obtenemos el usuario y su rol

    return (
        <div className={styles.dashboard}>
            <h2>Dashboard</h2>

            <div className={styles.statsGrid}>
                {/* 💰 Ventas Hoy - Oculto para EMPLOYEE (Es un Reporte/Corte) */}
                {['SUPER_ADMIN', 'OWNER'].includes(user?.role) && (
                    <div className={styles.statCard}>
                        <h3>Ventas Hoy</h3>
                        <p className={styles.statValue}>$12,500</p>
                        <span className={styles.trend}>▲ 15% vs ayer</span>
                    </div>
                )}
                
                {/* 📝 Pedidos Pendientes - Visible para TODOS (Operativo) */}
                <div className={styles.statCard}>
                    <h3>Pedidos Pendientes</h3>
                    <p className={styles.statValue}>8</p>
                    <span className={styles.trend}>⚠️ 2 para hoy</span>
                </div>
                
                {/* 🎂 Producción - Visible para TODOS (Operativo) */}
                <div className={styles.statCard}>
                    <h3>Producción</h3>
                    <p className={styles.statValue}>12</p>
                    <span className={styles.trend}>Pasteles en horno</span>
                </div>
                
                {/* 👥 Usuarios Activos - Oculto para EMPLOYEE (Es Administración) */}
                {['SUPER_ADMIN', 'OWNER'].includes(user?.role) && (
                    <div className={styles.statCard}>
                        <h3>Usuarios Activos</h3>
                        <p className={styles.statValue}>5</p>
                        <span className={styles.trend}>En turno</span>
                    </div>
                )}
            </div>

            {/* 📊 Sección de Gráficas - Oculta para EMPLOYEE (Son Reportes) */}
            {['SUPER_ADMIN', 'OWNER'].includes(user?.role) && (
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
            )}
        </div>
    );
};

export default DashboardHome;