import { AlertBanner, Badge, Card, CardDescription, CardTitle, Table, type TableColumn } from '@/components/ui';
import type { UserRole } from '@/types/auth';

interface PortalWorkspacePageProps {
  role: UserRole;
  title: string;
  subtitle: string;
  modules: string[];
}

interface ModuleRow {
  moduleName: string;
  scope: string;
  status: string;
}

export function PortalWorkspacePage({
  role,
  title,
  subtitle,
  modules,
}: PortalWorkspacePageProps) {
  const rows: ModuleRow[] = modules.map((name) => ({
    moduleName: name,
    scope: `${role} Workflow`,
    status: 'Foundation Ready',
  }));

  const columns: TableColumn<ModuleRow>[] = [
    { key: 'moduleName', header: 'Module', isRowHeader: true, render: (r) => r.moduleName },
    { key: 'scope', header: 'Access Scope', render: (r) => r.scope },
    {
      key: 'status',
      header: 'Readiness',
      render: (r) => <Badge variant="brand">{r.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">{title}</h1>
          <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>
        </div>
        <Badge variant="info">{role} Route Group</Badge>
      </div>

      <AlertBanner
        variant="info"
        title="Role Workspace Foundation Active"
        description="Layout, routing, navigation, and responsive data tables are configured. Role-protected API data and actions will attach in upcoming implementation phases."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Role Scope</p>
          <CardTitle className="mt-1">{role}</CardTitle>
          <CardDescription className="mt-1 text-xs">Strict backend RBAC boundary</CardDescription>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">API Envelope</p>
          <CardTitle className="mt-1">Standardized</CardTitle>
          <CardDescription className="mt-1 text-xs">Correlation-ID traced requests</CardDescription>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Validation</p>
          <CardTitle className="mt-1">Zod + RHF</CardTitle>
          <CardDescription className="mt-1 text-xs">Shared schema error handling</CardDescription>
        </Card>
      </div>

      <Table
        caption={`${title} modules`}
        columns={columns}
        data={rows}
        rowKey={(r) => r.moduleName}
      />
    </div>
  );
}
