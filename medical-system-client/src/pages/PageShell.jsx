import PageContainer from '../components/common/PageContainer.jsx';
import { Card } from '../components/ui/index.jsx';

export default function PageShell({ title, description, children }) {
  return (
    <PageContainer>
      <Card>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Pantalla base</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p> : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </Card>
    </PageContainer>
  );
}

