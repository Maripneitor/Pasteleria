import { useState } from 'react';
import styles from './OrderCard.module.css';

const OrderCard = ({ order }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Construir URL de la imagen si existe
    // Nota: Ajustamos para quitar /api si uploads se sirve desde la raíz (común en express.static)
    // Pero si server.js dice app.use('/uploads'...), entonces es http://host:port/uploads
    // VITE_API_URL suele ser .../api

    // Si VITE_API_URL es http://localhost:3000/api, y uploads está en http://localhost:3000/uploads
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    const imageUrl = order.imagen_referencia_url
        ? `${baseUrl}${order.imagen_referencia_url.startsWith('/') ? '' : '/'}${order.imagen_referencia_url}`
        : null;

    return (
        <div className={styles.card}>
            {imageUrl && (
                <div className={styles.imageContainer} style={{ height: '150px', overflow: 'hidden', position: 'relative', borderBottom: '1px solid #eee' }}>
                    {!imageLoaded && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando...</span>
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt="Pastel reference"
                        onLoad={() => setImageLoaded(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: imageLoaded ? 'block' : 'none' }}
                        onError={(e) => { e.target.style.display = 'none'; }} // Ocultar si falla
                    />
                </div>
            )}
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
