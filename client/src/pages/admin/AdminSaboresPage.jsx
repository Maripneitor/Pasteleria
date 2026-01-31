import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';

export default function AdminSaboresPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader title="Sabores" subtitle="Catálogo de sabores y rellenos" />
            <Card className="p-6">
                <p className="text-gray-600">Aquí va el CRUD de sabores (en construcción).</p>
            </Card>
        </div>
    );
}
