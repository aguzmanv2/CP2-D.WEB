import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DatePicker,
  Input,
  Loader,
  Modal,
  Pagination,
  SearchBar,
  Select,
  Table,
  Textarea
} from '../ui/index.jsx';
import PageContainer from '../common/PageContainer.jsx';
import { classNames } from '../../utils/classNames.js';
import { getApiErrorMessage } from '../../utils/errors.js';
import { useToast } from '../../hooks/useToast.js';

const DEFAULT_STATUS_TONE = {
  Activo: 'success',
  Inactivo: 'secondary',
  Pendiente: 'warning',
  Confirmada: 'primary',
  Cancelada: 'error',
  Atendida: 'success',
  'No asistio': 'secondary',
  'De licencia': 'warning'
};

const buildPageItems = ({ page, totalPages }) => {
  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const fixedStart = Math.max(1, end - windowSize + 1);
  const pages = [];

  for (let index = fixedStart; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
};

const getItemId = (item) => item?.id || item?._id || '';

function LookupField({ field, meta, register, errors, setValue, watch }) {
  const options = typeof field.getOptions === 'function' ? field.getOptions(meta) : field.options || [];
  const selectedValue = watch(field.name);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const selected = options.find((option) => String(option.value) === String(selectedValue));
    if (selected) {
      setQuery(selected.searchText || selected.label || '');
      return;
    }

    if (!selectedValue) {
      setQuery('');
    }
  }, [options, selectedValue]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.label || ''} ${option.searchText || ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  const handleQueryChange = (value) => {
    setQuery(value);

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const exactMatches = options.filter((option) => {
      const haystack = `${option.label || ''} ${option.searchText || ''}`.toLowerCase();
      return haystack.includes(normalized);
    });

    if (exactMatches.length === 1) {
      setValue(field.name, exactMatches[0].value, { shouldDirty: true, shouldValidate: true });
    }
  };

  const registration = register(field.name, field.rules);

  return (
    <div className={classNames('crud-field', field.fullWidth ? 'crud-field--full' : '')}>
      <label className="crud-field__label">{field.label}</label>
      <div className="crud-field__group">
        <Input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={field.searchPlaceholder || 'Buscar por cedula, nombre o correo...'}
        />
        <Select
          {...registration}
          value={selectedValue || ''}
          onChange={(event) => {
            registration.onChange(event);
            setQuery(options.find((option) => String(option.value) === String(event.target.value))?.searchText || '');
          }}
        >
          <option value="">{field.placeholder || 'Seleccionar...'}</option>
          {filteredOptions.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {query && filteredOptions.length === 0 ? <p className="crud-lookup__empty">No se encontraron coincidencias. Si el paciente no existe, puede registrarlo primero.</p> : null}
      </div>
      {errors?.[field.name] ? <p className="ui-field-error">{errors[field.name].message}</p> : null}
    </div>
  );
}

function FieldRenderer({ field, meta, register, errors, setValue, watch }) {
  const options = typeof field.getOptions === 'function' ? field.getOptions(meta) : field.options || [];

  if (field.type === 'lookup') {
    return <LookupField field={field} meta={meta} register={register} errors={errors} setValue={setValue} watch={watch} />;
  }

  return (
    <div className={classNames('crud-field', field.fullWidth ? 'crud-field--full' : '')}>
      <label className="crud-field__label">{field.label}</label>
      {field.type === 'select' ? (
        <Select {...register(field.name, field.rules)}>
          <option value="">{field.placeholder || 'Seleccionar...'}</option>
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : field.type === 'textarea' ? (
        <Textarea placeholder={field.placeholder} {...register(field.name, field.rules)} />
      ) : field.type === 'date' ? (
        <DatePicker {...register(field.name, field.rules)} />
      ) : (
        <Input
          type={field.type === 'time' ? 'time' : field.type === 'number' ? 'number' : field.type || 'text'}
          placeholder={field.placeholder}
          step={field.step}
          {...register(field.name, field.rules)}
        />
      )}
      {errors?.[field.name] ? <p className="ui-field-error">{errors[field.name].message}</p> : null}
    </div>
  );
}

export default function CrudPage({
  title,
  description,
  entityName,
  createLabel,
  allowCreate = true,
  allowDelete = true,
  searchPlaceholder,
  columns,
  fields,
  service,
  metaLoader,
  mapItemToFormValues = (item) => item || {},
  mapFormToPayload = (values) => values,
  filterOptions = [],
  defaultFilters = {},
  sidebar,
  statusToneMap = DEFAULT_STATUS_TONE,
  defaultPageSize = 10,
  renderField
}) {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: defaultPageSize, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [activeFilters, setActiveFilters] = useState(defaultFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: mapItemToFormValues(null, meta)
  });

  const loadMeta = async () => {
    if (!metaLoader) {
      setLoading(false);
      return;
    }

    try {
      const nextMeta = await metaLoader();
      setMeta(nextMeta);
    } catch (err) {
      toastError({ title: 'Error', description: getApiErrorMessage(err, 'No se pudieron cargar los datos auxiliares.') });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (nextPage = page, nextSearch = search, nextFilters = activeFilters) => {
    setTableLoading(true);
    setServerError('');

    try {
      const response = await service.list({
        page: nextPage,
        limit: defaultPageSize,
        search: nextSearch,
        ...nextFilters
      });

      setItems(response.items || []);
      setPagination(response.pagination || pagination);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudieron cargar los registros.');
      setServerError(message);
      toastError({ title: 'Error', description: message });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadItems(page, search, activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, activeFilters]);

  useEffect(() => {
    if (isFormOpen) {
      reset(mapItemToFormValues(selectedItem, meta));
    }
  }, [isFormOpen, meta, reset, selectedItem, mapItemToFormValues]);

  const openCreate = () => {
    setSelectedItem(null);
    setServerMessage('');
    setServerError('');
    reset(mapItemToFormValues(null, meta));
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setServerMessage('');
    setServerError('');
    reset(mapItemToFormValues(item, meta));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    setServerError('');
    setServerMessage('');

    try {
      const payload = mapFormToPayload(values, selectedItem, meta);

      if (selectedItem) {
        await service.update(getItemId(selectedItem), payload);
        setServerMessage(`${entityName} actualizado correctamente.`);
        success({ title: 'Actualizado', description: `${entityName} actualizado correctamente.` });
      } else {
        await service.create(payload);
        setServerMessage(`${entityName} creado correctamente.`);
        success({ title: 'Guardado', description: `${entityName} creado correctamente.` });
      }

      closeForm();
      await loadItems(1, search, activeFilters);
      setPage(1);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo guardar el registro.');
      setServerError(message);
      toastError({ title: 'Error', description: message });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      await service.remove(getItemId(selectedItem));
      success({ title: 'Eliminado', description: `${entityName} eliminado correctamente.` });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      await loadItems(page, search, activeFilters);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo eliminar el registro.');
      toastError({ title: 'Error', description: message });
    } finally {
      setSaving(false);
    }
  };

  const renderTableBody = () => {
    if (tableLoading) {
      return (
        <tr>
          <td colSpan={columns.length} className="crud-page__table-cell">
            <div className="crud-page__table-loading">
              <Loader />
              Cargando registros...
            </div>
          </td>
        </tr>
      );
    }

    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="crud-page__table-cell">
            <div className="crud-page__empty">
              <p className="crud-page__empty-title">Sin resultados</p>
              <p className="crud-page__empty-text">No se encontraron registros para los filtros actuales.</p>
            </div>
          </td>
        </tr>
      );
    }

    return items.map((item) => (
      <tr key={getItemId(item)} className="crud-page__table-row">
        {columns.map((column) => {
          const columnContext = { meta, onEdit: openEdit, onDelete: askDelete };
          const content = column.render ? column.render(item, columnContext) : item[column.key];

          return (
            <td
              key={`${getItemId(item)}-${column.key}`}
              className={classNames(
                'crud-page__table-cell',
                column.align === 'right' ? 'crud-page__table-cell--right' : ''
              )}
            >
              {column.type === 'badge' ? (
                <Badge tone={statusToneMap[String(content)] || column.tone || 'primary'}>{content}</Badge>
              ) : (
                content
              )}
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <PageContainer className="crud-page">
      <div className="crud-page__header">
        <div>
          <p className="crud-page__eyebrow">Dashboard / {title}</p>
          <h1 className="crud-page__title">{title}</h1>
          {description ? <p className="crud-page__description">{description}</p> : null}
        </div>
        {allowCreate ? (
          <Button type="button" size="lg" onClick={openCreate} className="crud-page__header-button">
            {createLabel}
          </Button>
        ) : null}
      </div>

      {serverMessage ? (
        <Alert title="Operacion completada" description={serverMessage} type="success" />
      ) : null}
      {serverError ? <Alert title="Atencion" description={serverError} type="error" /> : null}

      <div className="crud-page__layout">
        <Card className="crud-page__panel">
          <div className="crud-page__toolbar">
            <SearchBar
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
            <div className="crud-page__toolbar-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setFilters(defaultFilters);
                  setActiveFilters(defaultFilters);
                  setPage(1);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>

          {filterOptions.length > 0 ? (
            <div className="crud-page__filters">
              {filterOptions.map((filter) => {
                if (filter.type === 'chips') {
                  return (
                    <div key={filter.key} className="crud-page__chip-group">
                      {filter.options.map((option) => {
                        const active = (filters[filter.key] ?? defaultFilters[filter.key] ?? '') === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const nextFilters = { ...filters, [filter.key]: option.value };
                              setFilters(nextFilters);
                              setActiveFilters(nextFilters);
                              setPage(1);
                            }}
                            className={classNames('crud-page__chip', active ? 'crud-page__chip--active' : '')}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (filter.type === 'date' || filter.inputType === 'date') {
                  return (
                    <div key={filter.key} className="crud-page__filter">
                      {filter.label ? <p className="crud-page__filter-label">{filter.label}</p> : null}
                      <DatePicker
                        value={filters[filter.key] || ''}
                        onChange={(event) => {
                          const nextFilters = { ...filters, [filter.key]: event.target.value };
                          setFilters(nextFilters);
                          setActiveFilters(nextFilters);
                          setPage(1);
                        }}
                      />
                    </div>
                  );
                }

                if (filter.type === 'select') {
                  const options = typeof filter.getOptions === 'function' ? filter.getOptions(meta) : filter.options || [];

                  return (
                    <div key={filter.key} className="crud-page__filter">
                      {filter.label ? <p className="crud-page__filter-label">{filter.label}</p> : null}
                      <Select
                        value={filters[filter.key] || ''}
                        onChange={(event) => {
                          const nextFilters = { ...filters, [filter.key]: event.target.value };
                          setFilters(nextFilters);
                          setActiveFilters(nextFilters);
                          setPage(1);
                        }}
                      >
                        <option value="">{filter.placeholder || 'Todos'}</option>
                        {options.map((option) => (
                          <option key={String(option.value)} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ) : null}

          <div className="crud-page__table-shell">
            <Table>
              <div className="crud-page__table-wrapper">
                <table className="crud-page__table">
                  <thead className="crud-page__table-head">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={column.align === 'right' ? 'crud-page__table-cell crud-page__table-cell--right' : 'crud-page__table-cell'}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{renderTableBody()}</tbody>
                </table>
              </div>
            </Table>

            <div className="crud-page__footer">
              <p className="crud-page__footer-summary">
                Mostrando {items.length > 0 ? `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)}` : '0'} de {pagination.total} registros
              </p>
              <Pagination>
                <div className="crud-page__pagination">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  >
                    Anterior
                  </Button>
                  {buildPageItems(pagination).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === pagination.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
                  >
                    Siguiente
                  </Button>
                </div>
              </Pagination>
            </div>
          </div>
        </Card>

        <div className="crud-page__sidebar">{typeof sidebar === 'function' ? sidebar({ items, meta, pagination, filters: activeFilters, loading }) : sidebar}</div>
      </div>

      <Modal open={isFormOpen} className="crud-modal--lg">
        <div className="crud-page__form">
          <div className="crud-page__modal-header">
            <div>
              <h2 className="crud-page__modal-title">{selectedItem ? `Editar ${entityName}` : `Nuevo ${entityName}`}</h2>
              <p className="crud-page__modal-description">
                Complete la informacion requerida para {selectedItem ? 'actualizar' : 'crear'} el registro.
              </p>
            </div>
            <button type="button" className="crud-page__modal-close" onClick={closeForm}>
              Cerrar
            </button>
          </div>

          {serverError ? <Alert type="error" description={serverError} /> : null}

          <form onSubmit={handleSubmit(onSubmit)} className="crud-page__form">
            <div className="crud-page__form-grid">
              {fields.map((field) => (
                <div key={field.name}>
                  {(() => {
                    const customField = renderField
                      ? renderField({
                          field,
                          meta,
                          register,
                          errors,
                          setValue,
                          watch,
                          selectedItem
                        })
                      : null;

                    if (customField) {
                      return customField;
                    }

                    return <FieldRenderer field={field} meta={meta} register={register} errors={errors} setValue={setValue} watch={watch} />;
                  })()}
                </div>
              ))}
            </div>

            <div className="crud-page__form-actions">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : selectedItem ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {allowDelete ? (
        <ConfirmDialog
          open={isDeleteOpen}
          title={`Eliminar ${entityName}`}
          description="Esta accion no se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </PageContainer>
  );
}
