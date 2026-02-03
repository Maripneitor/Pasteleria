
import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FileText, Mail, Calendar, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsApi from '../services/reportsApi';
import commissionsApi from '../services/commissionsApi';
import { handlePdfResponse } from '../utils/pdfHelper';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table';

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'commissions'

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 fade-in pb-20">
            <PageHeader
                title="Reportes y Estadísticas"
                subtitle="Generación de cortes y reportes financieros"
            />

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'daily'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Corte Diario
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'commissions'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Comisiones
                </button>
            </div>

            {activeTab === 'daily' ? <DailyCutTab /> : <CommissionsTab />}
        </div>
    );
};

const DailyCutTab = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const handlePreview = async () => {
        setLoadingPdf(true);
        try {
            await handlePdfResponse(() => reportsApi.getDailyCutPdf(date));
        } catch (e) {
            console.error(e);
            // handlePdfResponse shows toast
        } finally {
            setLoadingPdf(false);
        }
    };

    const handleSendEmail = async () => {
        if (!window.confirm(`¿Enviar corte del día ${date} por correo?`)) return;

        setSendingEmail(true);
        try {
            await reportsApi.sendDailyCut(date);
            toast.success("Corte enviado correctamente");
        } catch (e) {
            const msg = e.response?.data?.details || e.response?.data?.message || "Error al enviar corte";
            toast.error(msg);
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <Card title="Generar Corte de Caja">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha del Corte</label>
                        <input
                            type="date"
                            name="reportDate"
                            id="reportDate"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            icon={loadingPdf ? Loader2 : FileText}
                            onClick={handlePreview}
                            disabled={loadingPdf}
                        >
                            {loadingPdf ? 'Generando PDF...' : 'Ver PDF (Vista Previa)'}
                        </Button>

                        <Button
                            variant="secondary"
                            icon={sendingEmail ? Loader2 : Mail}
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                        >
                            {sendingEmail ? 'Enviando...' : 'Enviar por Correo a Admin'}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="bg-blue-50 border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-2">Información</h3>
                <p className="text-sm text-blue-700 mb-4">
                    Este reporte incluye todos los pedidos programados para entrega en la fecha seleccionada.
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Totales de ventas y anticipos</li>
                    <li>Lista detallada de pedidos</li>
                    <li>Saldos pendientes</li>
                </ul>
            </Card>
        </div>
    );
};

const CommissionsTab = () => {
    const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
    const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [data, setData] = useState([]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await commissionsApi.getReport(from, to);
            // Verify structure from backend: res.reportData
            setData(res.reportData || []);
        } catch (e) {
            console.error(e);
            toast.error("Error cargando reporte de comisiones");
        } finally {
            setLoading(false);
        }
    };

    const handlePdf = async () => {
        setLoadingPdf(true);
        try {
            await handlePdfResponse(() => commissionsApi.getReportPdf(from, to));
        } catch {
            // handlePdfResponse handles toasts
        } finally {
            setLoadingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            id="commFrom"
                            name="commFrom"
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            id="commTo"
                            name="commTo"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            icon={Search}
                            onClick={fetchReport}
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Consultar'}
                        </Button>
                        <Button
                            variant="secondary"
                            icon={loadingPdf ? Loader2 : FileText}
                            onClick={handlePdf}
                            disabled={loadingPdf}
                        >
                            PDF
                        </Button>
                    </div>
                </div>
            </Card>

            {data.length > 0 && (
                <Card title="Resultados">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead className="text-right">Pedidos</TableHead>
                                <TableHead className="text-right">Total Ventas</TableHead>
                                <TableHead className="text-right">Comisión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">{row.userName}</TableCell>
                                    <TableCell className="text-right">{row.totalOrders}</TableCell>
                                    <TableCell className="text-right">${Number(row.totalSales).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-pink-600">
                                        ${Number(row.totalCommission).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

export default ReportsPage;
