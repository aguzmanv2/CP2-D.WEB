import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Card, Input, Modal } from '../ui/index.jsx';
import { usersService } from '../../services/users.service.js';
import api from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { getApiErrorMessage } from '../../utils/errors.js';

const normalizeCedula = (value) => String(value || '').replace(/\s+/g, '').replace(/-/g, '').trim();

export default function PatientCedulaField({ field, errors, register, setValue, watch, selectedItem }) {
  const { success, error: toastError } = useToast();
  const [lookupState, setLookupState] = useState({ status: 'idle', user: null, message: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [searchToken, setSearchToken] = useState(0);

  const cedulaValue = watch(field.name) || '';
  const normalizedCedula = useMemo(() => normalizeCedula(cedulaValue), [cedulaValue]);
  const registration = register(field.name, field.rules);

  const {
    register: registerPublic,
    handleSubmit: handlePublicSubmit,
    reset: resetPublicForm,
    formState: { errors: publicErrors, isSubmitting: publicSubmitting }
  } = useForm({
    defaultValues: {
      cedula: '',
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (selectedItem) {
      setLookupState({ status: 'idle', user: null, message: '' });
      return undefined;
    }

    if (!normalizedCedula || normalizedCedula.length < 6) {
      setLookupState({ status: 'idle', user: null, message: '' });
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLookupState((current) => ({ ...current, status: 'loading', message: '' }));

      try {
        const user = await usersService.lookupByCedula(normalizedCedula);
        setLookupState({ status: 'found', user, message: 'La cédula pertenece a una cuenta registrada previamente.' });
        setValue('nombre', user.nombre || '', { shouldDirty: true, shouldValidate: true });
        setValue('apellido', user.apellido || '', { shouldDirty: true, shouldValidate: true });
        setValue('correo', user.correo || '', { shouldDirty: true, shouldValidate: true });
      } catch (error) {
        const status = error?.response?.status;

        if (status === 404) {
          setLookupState({
            status: 'missing',
            user: null,
            message: 'No encontramos una cuenta pública con esa cédula.'
          });
          setValue('nombre', '', { shouldDirty: true, shouldValidate: true });
          setValue('apellido', '', { shouldDirty: true, shouldValidate: true });
          setValue('correo', '', { shouldDirty: true, shouldValidate: true });
          return;
        }

        const message = getApiErrorMessage(error, 'No se pudo consultar la cédula.');
        setLookupState({ status: 'error', user: null, message });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [normalizedCedula, selectedItem, setValue, searchToken]);

  useEffect(() => {
    if (modalOpen) {
      resetPublicForm({
        cedula: cedulaValue || '',
        nombre: '',
        apellido: '',
        correo: '',
        password: '',
        confirmPassword: ''
      });
      setModalError('');
    }
  }, [cedulaValue, modalOpen, resetPublicForm]);

  const handleOpenRegisterModal = () => {
    setModalError('');
    setModalOpen(true);
  };

  const handlePublicRegister = async (values) => {
    setModalError('');

    if (values.password !== values.confirmPassword) {
      setModalError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const payload = {
        cedula: normalizeCedula(values.cedula),
        nombre: values.nombre,
        apellido: values.apellido,
        correo: values.correo,
        password: values.password
      };

      const response = await api.post('/auth/register', payload);
      const user = response.data?.data?.user;

      if (user) {
        setValue('cedula', user.cedula || payload.cedula, { shouldDirty: true, shouldValidate: true });
        setValue('nombre', user.nombre || payload.nombre, { shouldDirty: true, shouldValidate: true });
        setValue('apellido', user.apellido || payload.apellido, { shouldDirty: true, shouldValidate: true });
        setValue('correo', user.correo || payload.correo, { shouldDirty: true, shouldValidate: true });
      }

      setLookupState({
        status: 'found',
        user: user || payload,
        message: 'La cuenta pública fue creada y vinculada con la cédula ingresada.'
      });
      setModalOpen(false);
      success({ title: 'Cuenta creada', description: 'La cuenta pública del paciente fue registrada correctamente.' });
      setSearchToken((current) => current + 1);
    } catch (error) {
      const details = error?.response?.data?.details?.errors;
      if (Array.isArray(details) && details.length > 0) {
        setModalError(details[0].msg || 'Verifique los datos del formulario.');
        return;
      }

      const message = getApiErrorMessage(error, 'No se pudo registrar la cuenta del paciente.');
      setModalError(message);
      toastError({ title: 'Error', description: message });
    }
  };

  return (
    <div className={field.fullWidth ? 'crud-field crud-field--full' : 'crud-field'}>
      <label className="crud-field__label">{field.label}</label>
      <Input type="text" placeholder={field.placeholder} {...registration} />

      <div className="crud-field__group">
        {lookupState.status === 'loading' ? <p className="crud-field__note">Buscando paciente...</p> : null}
        {lookupState.message ? (
          <Alert
            type={lookupState.status === 'missing' ? 'warning' : lookupState.status === 'found' ? 'success' : 'info'}
            description={lookupState.message}
          />
        ) : null}

        {lookupState.status === 'missing' && !selectedItem ? (
          <Button type="button" variant="outline" size="sm" onClick={handleOpenRegisterModal}>
            Registrar paciente
          </Button>
        ) : null}
      </div>

      {errors?.[field.name] ? <p className="ui-field-error">{errors[field.name].message}</p> : null}

      <Modal open={modalOpen} className="crud-modal--md">
        <form className="crud-page__form" onSubmit={handlePublicSubmit(handlePublicRegister)}>
          <div className="crud-page__modal-header">
            <div>
              <h3 className="crud-page__modal-title">Registrar paciente</h3>
              <p className="crud-page__modal-description">Cree la cuenta pública para vincularla con la cédula ingresada.</p>
            </div>
            <button type="button" className="crud-page__modal-close" onClick={() => setModalOpen(false)}>
              Cerrar
            </button>
          </div>

          <Card className="crud-page__panel">
            <div className="crud-page__form-grid">
              <div className="crud-field crud-field--full">
                <label className="crud-field__label">Cédula</label>
                <Input
                  type="text"
                  placeholder="0-0000-0000"
                  {...registerPublic('cedula', { required: 'La cédula es obligatoria' })}
                />
                {publicErrors.cedula ? <p className="ui-field-error">{publicErrors.cedula.message}</p> : null}
              </div>

              <div className="crud-field">
                <label className="crud-field__label">Nombre</label>
                <Input type="text" placeholder="Nombre" {...registerPublic('nombre', { required: 'El nombre es obligatorio' })} />
                {publicErrors.nombre ? <p className="ui-field-error">{publicErrors.nombre.message}</p> : null}
              </div>

              <div className="crud-field">
                <label className="crud-field__label">Apellido</label>
                <Input type="text" placeholder="Apellido" {...registerPublic('apellido', { required: 'El apellido es obligatorio' })} />
                {publicErrors.apellido ? <p className="ui-field-error">{publicErrors.apellido.message}</p> : null}
              </div>

              <div className="crud-field crud-field--full">
                <label className="crud-field__label">Correo</label>
                <Input
                  type="email"
                  placeholder="paciente@correo.com"
                  {...registerPublic('correo', {
                    required: 'El correo es obligatorio',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Ingrese un correo valido'
                    }
                  })}
                />
                {publicErrors.correo ? <p className="ui-field-error">{publicErrors.correo.message}</p> : null}
              </div>

              <div className="crud-field">
                <label className="crud-field__label">Contraseña</label>
                <Input
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  {...registerPublic('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                  })}
                />
                {publicErrors.password ? <p className="ui-field-error">{publicErrors.password.message}</p> : null}
              </div>

              <div className="crud-field">
                <label className="crud-field__label">Confirmar contraseña</label>
                <Input
                  type="password"
                  placeholder="Repita la contraseña"
                  {...registerPublic('confirmPassword', {
                    required: 'Confirme la contraseña'
                  })}
                />
                {publicErrors.confirmPassword ? <p className="ui-field-error">{publicErrors.confirmPassword.message}</p> : null}
              </div>
            </div>

            {modalError ? <Alert type="error" description={modalError} /> : null}
          </Card>

          <div className="crud-page__form-actions">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={publicSubmitting}>
              {publicSubmitting ? 'Registrando...' : 'Registrar cuenta'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
