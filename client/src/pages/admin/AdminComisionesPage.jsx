import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';

export default function AdminComisionesPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader title="Comisiones" subtitle="Comisiones por ventas" />
            <Card className="p-6">
                <p className="text-gray-600">Aquí va el módulo de comisiones (en construcción).</p>
            </Card>
        </div>
    );
}
