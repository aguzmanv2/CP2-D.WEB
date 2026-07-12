import { useEffect, useMemo, useState } from 'react';
import { Badge, Alert, Button, Card, Input } from '../ui/index.jsx';

const normalizeCedula = (value) => String(value || '').replace(/\s+/g, '').replace(/-/g, '').trim().toLowerCase();

export default function AppointmentPatientField({ field, meta, register, errors, setValue, watch }) {
  const options = useMemo(() => meta?.patients || [], [meta]);
  const selectedValue = watch(field.name);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchState, setSearchState] = useState({ status: 'idle', message: '' });

  const selectedPatient = useMemo(
    () => options.find((patient) => String(patient.id) === String(selectedValue)) || null,
    [options, selectedValue]
  );

  useEffect(() => {
    if (selectedPatient) {
      setQuery(selectedPatient.cedula || '');
      setResults([]);
      setSearchState({ status: 'selected', message: '' });
      return;
    }

    if (!selectedValue) {
      setSearchState({ status: 'idle', message: '' });
    }
  }, [selectedPatient, selectedValue]);

  useEffect(() => {
    if (selectedPatient) {
      return undefined;
    }

    const normalizedQuery = normalizeCedula(query);

    if (normalizedQuery.length < 6) {
      setResults([]);
      setSearchState({ status: 'idle', message: 'Escriba una cédula para buscar pacientes registrados.' });
      return undefined;
    }

    const timer = setTimeout(() => {
      const matches = options.filter((patient) => {
        const cedula = normalizeCedula(patient.cedula);
        return cedula.startsWith(normalizedQuery);
      });

      setResults(matches.slice(0, 8));

      if (matches.length === 0) {
        setSearchState({
          status: 'missing',
          message: 'No se encontraron pacientes con esa cédula.'
        });
        setValue(field.name, '', { shouldDirty: true, shouldValidate: true });
        return;
      }

      setSearchState({
        status: 'results',
        message: `${matches.length} paciente${matches.length === 1 ? '' : 's'} encontrado${matches.length === 1 ? '' : 's'}.`
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [field.name, options, query, selectedPatient, setValue]);

  const registration = register(field.name, field.rules);

  const handleQueryChange = (value) => {
    setQuery(value);
    setValue(field.name, '', { shouldDirty: true, shouldValidate: true });
  };

  const handleSelectPatient = (patient) => {
    setValue(field.name, patient.id, { shouldDirty: true, shouldValidate: true });
    setQuery(patient.cedula || '');
    setResults([]);
    setSearchState({
      status: 'selected',
      message: `Paciente seleccionado: ${patient.cedula} - ${patient.nombre} ${patient.apellido}`
    });
  };

  return (
    <div className={field.fullWidth ? 'crud-field crud-field--full' : 'crud-field'}>
      <label className="crud-field__label">{field.label}</label>
      <div className="crud-field__group">
        <Input
          type="text"
          placeholder={field.placeholder || 'Escriba la cédula del paciente'}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onBlur={registration.onBlur}
          name={registration.name}
          ref={registration.ref}
        />

        {searchState.message ? (
          <Alert
            type={searchState.status === 'missing' ? 'warning' : searchState.status === 'selected' ? 'success' : 'info'}
            description={searchState.message}
          />
        ) : null}

        {results.length > 0 && !selectedPatient ? (
          <Card className="crud-lookup">
            <p className="ui-card__eyebrow">Resultados</p>
            <div className="crud-lookup__results">
              {results.map((patient) => (
                <button key={patient.id} type="button" onClick={() => handleSelectPatient(patient)} className="crud-lookup__result">
                  <div className="crud-lookup__result-row">
                    <div>
                      <p className="crud-lookup__result-title">
                        {patient.nombre} {patient.apellido}
                      </p>
                      <p className="crud-lookup__result-meta">{patient.cedula}</p>
                    </div>
                    <Badge tone="primary">Seleccionar</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {errors?.[field.name] ? <p className="ui-field-error">{errors[field.name].message}</p> : null}
    </div>
  );
}
