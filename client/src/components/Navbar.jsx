import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <nav className={styles.navbar}>
            <div className={styles.brand}>
                <h1>Pastelería La Fiesta</h1>
            </div>

            <div className={styles.controls}>
                <div className={styles.clock}>
                    {time.toLocaleTimeString()}
                </div>

                <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle Theme">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className={styles.userProfile}>
                    <img src={user?.avatar} alt="User Avatar" className={styles.avatar} />
                    <span className={styles.userName}>{user?.name}</span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
