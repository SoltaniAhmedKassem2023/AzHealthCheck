'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';

interface ReusableTableProps {
  data: any[];
  loading?: boolean;
  rows?: number;
}

const ReusableTable: React.FC<ReusableTableProps> = ({ data, loading = false, rows = 10 }) => {
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p>No data to display.</p>;
  }

  const columns = Object.keys(data[0]).map((key) => (
    <Column key={key} field={key} header={key} sortable />
  ));

  return (
    <DataTable value={data} rows={rows} paginator responsiveLayout="scroll">
      {columns}
    </DataTable>
  );
};

export default ReusableTable;
    