import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Input } from '../components/ui/index.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      cedula: '',
      nombre: '',
      apellido: '',
      correo: '',
      password: ''
    }
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const onSubmit = async (values) => {
    setServerError('');

    try {
      const response = await api.post('/auth/register', values);
      const { token, user } = response.data.data;
      await login(token, user);
    } catch (error) {
      const details = error?.response?.data?.details?.errors;
      if (Array.isArray(details) && details.length > 0) {
        setServerError(details[0].msg || 'Por favor, verifica los campos del formulario.');
        return;
      }

      setServerError(error?.response?.data?.message || 'No se puede registrar en este momento.');
    }
  };

  return (
    <div className="auth-view">
      <div className="auth-card">
        <div className="auth-card__orb auth-card__orb--top" />
        <div className="auth-card__orb auth-card__orb--bottom" />

        <div className="auth-grid">
          <section className="auth-panel">
            <div className="auth-panel__content">
              <button type="button" onClick={() => navigate('/login')} className="auth-back">
                <ArrowLeft className="icon-sm" />
                Regresar a la pantalla de inicio de sesión
              </button>

              <h1 className="auth-title">Registra tu cuenta</h1>
              <p className="auth-subtitle">Completa los campos para crear tu cuenta</p>

              <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                <div>
                  <Input
                    type="text"
                    placeholder="Cédula"
                    className="auth-field"
                    {...register('cedula', {
                      required: 'Por favor, ingresa tu número de identificación.'
                    })}
                  />
                  {errors.cedula ? <p className="auth-error">{errors.cedula.message}</p> : null}
                </div>

                <div className="auth-two-col">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nombre"
                      className="auth-field"
                      {...register('nombre', {
                        required: 'Por favor, ingresa tu nombre.'
                      })}
                    />
                    {errors.nombre ? <p className="auth-error">{errors.nombre.message}</p> : null}
                  </div>

                  <div>
                    <Input
                      type="text"
                      placeholder="Apellido"
                      className="auth-field"
                      {...register('apellido', {
                        required: 'Por favor, ingresa tu apellido.'
                      })}
                    />
                    {errors.apellido ? <p className="auth-error">{errors.apellido.message}</p> : null}
                  </div>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Correo electrónico"
                    className="auth-field"
                    {...register('correo', {
                      required: 'Por favor, ingresa tu correo electrónico.',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Por favor, ingresa un correo electrónico válido.'
                      }
                    })}
                  />
                  {errors.correo ? <p className="auth-error">{errors.correo.message}</p> : null}
                </div>

                <div>
                  <div className="auth-password">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      className="auth-field"
                      {...register('password', {
                        required: 'Por favor, ingresa tu contraseña.',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres.'
                        }
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="auth-password__toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                    </button>
                  </div>
                  {errors.password ? <p className="auth-error">{errors.password.message}</p> : null}
                </div>

                {serverError ? <p className="auth-error">{serverError}</p> : null}

                <div className="auth-submit-wrap">
                  <button type="submit" disabled={isSubmitting} className="auth-submit">
                    {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    <UserPlus className="icon-sm" />
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="auth-side">
            <div className="auth-side__content">
              <h2 className="auth-side__title">Bienvenido</h2>
              <p className="auth-side__text">¿Ya tienes una cuenta? Regresa a la pantalla de inicio de sesión y continúa.</p>

              <div className="auth-side__actions">
                <button type="button" onClick={() => navigate('/login')} className="auth-pill-button">
                  Iniciar sesión
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
