import React, { useState, useEffect } from 'react';
import client from '../config/axios';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await client.get('/audit');
            setLogs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Auditoría & Seguridad"
                subtitle="Registro de actividades del sistema."
                actions={
                    <Button variant="secondary" onClick={fetchLogs} icon={RefreshCw} loading={loading}>
                        Refrescar
                    </Button>
                }
            />

            <Card>
                <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <ShieldAlert className="text-blue-600" size={24} />
                    <p className="text-sm text-blue-800">
                        El sistema registra automáticamente cambios de estado críticos y accesos.
                    </p>
                </div>

                {!logs.length ? (
                    <EmptyState title="Sin registros" description="No hay actividad registrada aún." />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Entidad</TableHead>
                                <TableHead>Detalle</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                        {log.actor?.username || log.actor?.email || `User #${log.actorUserId}`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            log.action.includes('DELETE') || log.action.includes('CANCEL') ? 'danger' :
                                                log.action.includes('CREATE') ? 'success' : 'info'
                                        }>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-xs font-mono">{log.entity} #{log.entityId}</TableCell>
                                    <TableCell className="text-xs text-gray-400 font-mono max-w-xs truncate">
                                        {JSON.stringify(log.meta)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
