import styles from './CashRegister.module.css';

const CashRegister = () => {
    return (
        <div className={styles.container}>
            <h2>Corte de Caja</h2>

            <div className={styles.registerGrid}>
                <div className={styles.card}>
                    <h3>Inicio de Turno</h3>
                    <div className={styles.inputGroup}>
                        <label>Monto Inicial</label>
                        <input type="number" placeholder="$0.00" />
                    </div>
                    <button className={styles.actionBtn}>Abrir Caja</button>
                </div>

                <div className={styles.card}>
                    <h3>Resumen del Turno</h3>
                    <div className={styles.summaryItem}>
                        <span>Ventas Efectivo:</span>
                        <span>$4,500.00</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span>Ventas Tarjeta:</span>
                        <span>$2,100.00</span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.total}`}>
                        <span>Total Sistema:</span>
                        <span>$6,600.00</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3>Cierre de Turno</h3>
                    <div className={styles.inputGroup}>
                        <label>Monto Final (Conteo)</label>
                        <input type="number" placeholder="$0.00" />
                    </div>
                    <div className={styles.difference}>
                        Diferencia: <span className={styles.negative}>-$50.00</span>
                    </div>
                    <button className={`${styles.actionBtn} ${styles.danger}`}>Cerrar Turno</button>
                </div>
            </div>
        </div>
    );
};

export default CashRegister;
