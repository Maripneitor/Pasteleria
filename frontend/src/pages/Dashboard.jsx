import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            <h1>Bienvenido al Dashboard</h1>
            {user && <p>Usuario: {user.username}</p>}
            <button onClick={handleLogout}>Cerrar Sesión</button>

            <div className="content">
                <p>Aquí irá el contenido principal del sistema.</p>
            </div>
        </div>
    );
};

export default Dashboard;
