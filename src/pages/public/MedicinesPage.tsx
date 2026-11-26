import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Pill, Search } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, Select, Table, type TableColumn } from '@/components/ui';

interface CatalogPreviewItem {
  id: string;
  name: string;
  dosageForm: string;
  prescriptionRequired: boolean;
  category: string;
  status: string;
}

const SAMPLE_CATALOG_SCHEMA: CatalogPreviewItem[] = [];

export function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [rxFilter, setRxFilter] = useState('ALL');

  const columns: TableColumn<CatalogPreviewItem>[] = [
    { key: 'name', header: 'Medicine', isRowHeader: true, render: (row) => row.name },
    { key: 'dosageForm', header: 'Form', render: (row) => row.dosageForm },
    { key: 'category', header: 'Category', render: (row) => row.category },
    {
      key: 'rx',
      header: 'Prescription',
      render: (row) => (
        <Badge variant={row.prescriptionRequired ? 'warning' : 'success'}>
          {row.prescriptionRequired ? 'Rx Required' : 'OTC'}
        </Badge>
      ),
    },
    { key: 'status', header: 'Approval', render: (row) => row.status },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Medicine Catalog</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Approved prescription and OTC medicines listed by verified Medexa pharmacies.
          </p>
        </div>
        <Badge variant="brand" icon={<Pill className="h-3.5 w-3.5" />}>
          Catalog Module Ready
        </Badge>
      </div>

      <Card className="mt-6">
        <search>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams(query.trim() ? { q: query.trim() } : {});
            }}
            className="grid gap-4 sm:grid-cols-12 sm:items-end"
          >
            <div className="sm:col-span-6">
              <Input
                label="Search Medicines"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by generic name, brand, or molecule"
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                label="Dispensing Requirement"
                value={rxFilter}
                onChange={(e) => setRxFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Medicines' },
                  { value: 'OTC', label: 'Over-the-Counter (OTC)' },
                  { value: 'RX', label: 'Prescription Required (Rx)' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" fullWidth leftIcon={<Filter className="h-4 w-4" />}>
                Apply
              </Button>
            </div>
          </form>
        </search>
      </Card>

      <AlertBanner
        className="mt-6"
        variant="info"
        title="Catalog API Integration Scheduled"
        description="Medicine listings, batch availability, and pharmacy filtering connect here once the Medicine Catalog & Inventory backend phase is implemented."
      />

      <div className="mt-6">
        <Table
          caption="Medicine catalog search results"
          columns={columns}
          data={SAMPLE_CATALOG_SCHEMA}
          rowKey={(item) => item.id}
          emptyMessage="No approved medicines are loaded yet. Connect the backend catalog endpoints in the next phase to display live pharmacy inventory."
        />
      </div>
    </div>
  );
}
