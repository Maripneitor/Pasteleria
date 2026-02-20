
import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FileText, Mail, Calendar, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsApi from '../services/reportsApi';
import commissionsApi from '../services/commissionsApi';
import accountingApi from '../services/accountingApi';
import { handlePdfResponse, generatePdfFromDom, getPdfBlobFromDom } from '../utils/pdfHelper';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table';

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'commissions' | 'balance'

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
                <button
                    onClick={() => setActiveTab('balance')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'balance'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Balance General
                </button>
            </div>

            {activeTab === 'daily' && <DailyCutTab />}
            {activeTab === 'commissions' && <CommissionsTab />}
            {activeTab === 'balance' && <BalanceTab />}
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

    const handleSendEmail = async (force = false) => {
        if (!force && !window.confirm(`¿Enviar corte del día ${date} por correo?`)) return;

        setSendingEmail(true);
        try {
            const res = await reportsApi.sendDailyCut(date, force);

            if (res.skipped) {
                // Already sent case
                if (window.confirm(`${res.message}\n¿Deseas FORZAR el reenvío a los admin?`)) {
                    // Recursive call with force=true
                    setSendingEmail(false); // Reset state to avoid lock
                    handleSendEmail(true);
                    return;
                }
            } else {
                toast.success(res.message || "Corte enviado correctamente");
            }

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
                            onClick={() => handleSendEmail(false)}
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

const BalanceTab = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('balance-report-content');
        if (!element) return toast.error("No hay contenido para generar el PDF");

        setGenerating(true);
        try {
            await generatePdfFromDom(element, `Balance_${date}.pdf`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!email) return toast.error("Ingresa un correo de destino");
        const element = document.getElementById('balance-report-content');
        if (!element) return toast.error("No hay contenido para generar el PDF");

        setSending(true);
        const loadingToast = toast.loading('Generando y enviando reporte...');
        try {
            const pdfBlob = await getPdfBlobFromDom(element);
            await accountingApi.sendReportByEmail(pdfBlob, email, date, "Reporte de Balance General");

            toast.dismiss(loadingToast);
            toast.success("Reporte enviado con éxito");
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message || "Error al enviar el reporte");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card title="Configuración del Reporte" className="md:col-span-1">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Corte</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo de Destino</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div className="pt-2 space-y-2">
                            <Button
                                variant="primary"
                                fullWidth
                                icon={generating ? Loader2 : FileText}
                                onClick={handleDownloadPdf}
                                disabled={generating || sending}
                            >
                                Descargar PDF
                            </Button>
                            <Button
                                variant="secondary"
                                fullWidth
                                icon={sending ? Loader2 : Mail}
                                onClick={handleSendEmail}
                                disabled={generating || sending}
                            >
                                Enviar por Correo
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="md:col-span-2 overflow-hidden bg-white">
                    <div id="balance-report-content" className="p-8 bg-white text-gray-800">
                        <div className="text-center border-bottom pb-4 mb-6" style={{ borderBottom: '2px solid #e91e63' }}>
                            <h2 className="text-2xl font-bold text-pink-600">Pastelería La Fiesta</h2>
                            <p className="text-sm text-gray-500 uppercase tracking-widest">Balance General de Operaciones</p>
                        </div>

                        <div className="flex justify-between mb-8 text-sm">
                            <div>
                                <p className="font-bold">Sucursal: <span className="font-normal">Matriz Centro</span></p>
                                <p className="font-bold">Periodo: <span className="font-normal">{date}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">Folio de Reporte: <span className="font-normal font-mono">BG-{date.replace(/-/g, '')}</span></p>
                                <p className="font-bold">Estado: <span className="font-normal">Cierre de Operación</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h4 className="font-bold border-b mb-3 text-green-700">🟢 INGRESOS</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span>Ventas Directas</span> <span>$12,500.00</span></div>
                                    <div className="flex justify-between"><span>Anticipos Recibidos</span> <span>$4,200.00</span></div>
                                    <div className="flex justify-between border-t pt-1 font-bold"><span>Total Ingresos</span> <span>$16,700.00</span></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold border-b mb-3 text-red-700">🔴 EGRESOS</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span>Compra de Insumos</span> <span>$3,150.00</span></div>
                                    <div className="flex justify-between"><span>Gastos Operativos</span> <span>$1,200.00</span></div>
                                    <div className="flex justify-between border-t pt-1 font-bold"><span>Total Egresos</span> <span>$4,350.00</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 mb-8">
                            <div className="flex justify-between items-center text-lg font-bold text-pink-700">
                                <span>TOTAL BALANCE NETO:</span>
                                <span>$12,350.00</span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-gray-400 mt-20 border-t pt-4">
                            Este documento es un reporte generado automáticamente por el sistema contable de Pastelería La Fiesta.
                            <br />© 2026 - Gestión Operativa Integral
                        </div>
                    </div>
                </Card>
            </div>
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
