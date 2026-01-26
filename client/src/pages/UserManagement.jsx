import { useState } from 'react';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const [users] = useState([
        { id: 1, name: 'Admin', role: 'Administrador', email: 'admin@pasteleria.com' },
        { id: 2, name: 'Cajero 1', role: 'Cajero', email: 'caja1@pasteleria.com' },
        { id: 3, name: 'Pastelero Juan', role: 'Pastelero', email: 'juan@pasteleria.com' },
    ]);

    const [permissions] = useState([
        { id: 'view_cash', label: 'Ver Caja' },
        { id: 'edit_order', label: 'Editar Pedido' },
        { id: 'delete_user', label: 'Eliminar Usuario' },
    ]);

    return (
        <div className={styles.container}>
            <h2>Usuarios y Roles</h2>

            <div className={styles.contentGrid}>
                <div className={styles.tableSection}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td><span className={styles.roleBadge}>{user.role}</span></td>
                                    <td><button className={styles.editBtn}>Editar</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.roleEditor}>
                    <h3>Editor de Permisos</h3>
                    <p className={styles.hint}>Selecciona un rol para editar permisos granulares.</p>
                    <div className={styles.permissionList}>
                        {permissions.map(perm => (
                            <label key={perm.id} className={styles.checkboxLabel}>
                                <input type="checkbox" />
                                {perm.label}
                            </label>
                        ))}
                    </div>
                    <button className={styles.saveBtn}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
