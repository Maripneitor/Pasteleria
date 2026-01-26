import styles from './OrderCard.module.css';

const OrderCard = ({ order }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.orderId}>#{order.id}</span>
                <span className={`${styles.status} ${styles[order.status.toLowerCase().replace(' ', '')]}`}>
                    {order.status}
                </span>
            </div>
            <div className={styles.body}>
                <h3>{order.clientName}</h3>
                <p className={styles.details}>{order.description}</p>
                <p className={styles.date}>Entrega: {order.deliveryDate}</p>
            </div>
            <div className={styles.footer}>
                <button className={styles.btnPdf} onClick={() => alert(`Generando PDF para #${order.id}`)}>
                    📄 PDF
                </button>
                <button className={styles.btnEdit} onClick={() => alert(`Editando #${order.id}`)}>
                    ✏️ Editar
                </button>
            </div>
        </div>
    );
};

export default OrderCard;
