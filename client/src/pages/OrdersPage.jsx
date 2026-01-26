import { useState } from 'react';
import OrderCard from '../components/OrderCard';
import styles from './OrdersPage.module.css';

const OrdersPage = () => {
    // Dummy data
    const [orders] = useState([
        { id: '101', clientName: 'Juan Pérez', status: 'Pending', description: 'Pastel de Chocolate 3kg', deliveryDate: '10:00 AM' },
        { id: '102', clientName: 'Maria López', status: 'In Production', description: 'Pastel de Boda 3 Pisos', deliveryDate: '12:00 PM' },
        { id: '103', clientName: 'Carlos Ruiz', status: 'Ready', description: 'Cheesecake Fresa', deliveryDate: '2:00 PM' },
        { id: '104', clientName: 'Ana Gomez', status: 'Pending', description: 'Pastel Tres Leches', deliveryDate: '4:00 PM' },
    ]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Gestión de Pedidos</h2>
                <button className={styles.newBtn}>+ Nuevo Pedido</button>
            </header>

            <div className={styles.kanbanBoard}>
                {['Pending', 'In Production', 'Ready'].map(status => (
                    <div key={status} className={styles.column}>
                        <h3 className={styles.columnTitle}>{status}</h3>
                        <div className={styles.cardList}>
                            {orders.filter(o => o.status === status).map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrdersPage;
