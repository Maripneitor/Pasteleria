import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';

export default function AdminStatsPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader title="Reportes" subtitle="Módulo de reportes y cortes" />
            <Card className="p-6">
                <p className="text-gray-600">Aquí va el dashboard de reportes (en construcción).</p>
            </Card>
        </div>
    );
}
