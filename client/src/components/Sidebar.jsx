import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/orders', label: 'Pedidos', icon: '📦' },
        { path: '/cash-register', label: 'Caja', icon: '💰' },
        { path: '/production', label: 'Producción', icon: '📅' },
        { path: '/users', label: 'Usuarios', icon: '👥' },
        { path: '/audit', label: 'Auditoría', icon: '🕵️' },
    ];

    return (
        <aside className={styles.sidebar}>
            <ul className={styles.navList}>
                {navItems.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                            }
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
