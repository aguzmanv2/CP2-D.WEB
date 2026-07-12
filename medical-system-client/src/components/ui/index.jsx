import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { classNames } from '../../utils/classNames.js';

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={classNames(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className
      )}
      {...props}
    />
  );
});

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={classNames('ui-field', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={classNames('ui-field ui-field--textarea', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={classNames('ui-field ui-select', className)} {...props}>
      {children}
    </select>
  );
});

export const Checkbox = forwardRef(function Checkbox({ className, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={classNames('ui-checkbox', className)} {...props} />;
});

export const Radio = forwardRef(function Radio({ className, ...props }, ref) {
  return <input ref={ref} type="radio" className={classNames('ui-radio', className)} {...props} />;
});

export const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <label className={classNames('ui-switch', className)}>
      <input ref={ref} type="checkbox" className="ui-field--switch" {...props} />
      <span className="ui-switch__thumb" />
    </label>
  );
});

export const DatePicker = forwardRef(function DatePicker({ className, ...props }, ref) {
  return <input ref={ref} type="date" className={classNames('ui-field', className)} {...props} />;
});

export function Table({ children, className }) {
  return <div className={classNames('ui-table-shell', className)}>{children}</div>;
}

export function Pagination({ className, children }) {
  return <nav className={classNames('ui-pagination', className)}>{children}</nav>;
}

export function SearchBar({ className, ...props }) {
  return (
    <div className={classNames('ui-search', className)}>
      <Search className="ui-search__icon icon-sm" />
      <Input className="ui-search__field" {...props} />
    </div>
  );
}

export function Filter({ title, description, children, className }) {
  return (
    <Card className={classNames('space-y-3', className)}>
      {title ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{title}</p> : null}
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {children}
    </Card>
  );
}

export function Modal({ open, children, className }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop">
      <div className={classNames('ui-modal-panel ui-modal-panel--sm', className)}>{children}</div>
    </div>
  );
}

export function Dialog({ open, title, description, children, className }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop">
      <div className={classNames('ui-modal-panel ui-modal-panel--md', className)}>
        {title ? <h3 className="ui-dialog__title">{title}</h3> : null}
        {description ? <p className="ui-dialog__description">{description}</p> : null}
        <div className="ui-dialog__content">{children}</div>
      </div>
    </div>
  );
}

export function Card({ className, children }) {
  return <section className={classNames('ui-card', className)}>{children}</section>;
}

export function StatCard({ label, value, helper, className }) {
  return (
    <Card className={className}>
      <p className="ui-statcard__label">{label}</p>
      <p className="ui-statcard__value">{value}</p>
      {helper ? <p className="ui-statcard__helper">{helper}</p> : null}
    </Card>
  );
}

export function TurnCard({ title, subtitle, meta, className }) {
  return (
    <Card className={className}>
      <p className="ui-turncard__title">{title}</p>
      {subtitle ? <p className="ui-turncard__subtitle">{subtitle}</p> : null}
      {meta ? <p className="ui-turncard__meta">{meta}</p> : null}
    </Card>
  );
}

export function InfoCard({ title, description, className }) {
  return (
    <Card className={className}>
      <p className="ui-infocard__title">{title}</p>
      <p className="ui-infocard__description">{description}</p>
    </Card>
  );
}

export function Alert({ title, description, type = 'info', className }) {
  return (
    <div className={classNames('ui-alert', `ui-alert--${type}`, className)}>
      {title ? <p className="ui-alert__title">{title}</p> : null}
      {description ? <p className="ui-alert__description">{description}</p> : null}
    </div>
  );
}

export function Badge({ children, className, tone = 'primary' }) {
  return (
    <span className={classNames('ui-badge', `ui-badge--${tone}`, className)}>
      {children}
    </span>
  );
}

export function Toast({ title, description, type = 'info', className }) {
  return <Alert title={title} description={description} type={type} className={className} />;
}

export function Loader({ className }) {
  return <span className={classNames('ui-loader', className)} />;
}

export function Skeleton({ className }) {
  return <div className={classNames('ui-skeleton', className)} />;
}

export function Breadcrumb({ items = [], className }) {
  return (
    <nav className={classNames('ui-breadcrumb', className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="ui-breadcrumb__item">
          {index > 0 ? <span>/</span> : null}
          <span className={item.active ? 'ui-breadcrumb__item--active' : ''}>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}

export function Avatar({ name = 'U', className }) {
  return (
    <div className={classNames('ui-avatar', className)}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Dropdown({ trigger, children, className }) {
  return (
    <details className={classNames('ui-dropdown', className)}>
      <summary className="ui-dropdown__summary">{trigger}</summary>
      <div className="ui-dropdown__menu">{children}</div>
    </details>
  );
}

export function ConfirmDialog({
  open,
  title = 'Confirmar accion',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel
}) {
  return (
    <Modal open={open}>
      <div className="ui-confirm-dialog">
        <div>
          <h3 className="ui-confirm-dialog__title">{title}</h3>
          {description ? <p className="ui-confirm-dialog__description">{description}</p> : null}
        </div>
        <div className="ui-confirm-dialog__actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
