import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Facebook, Linkedin, LogIn, X } from 'lucide-react';
import { Input } from '../components/ui/index.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';

export default function LoginPage() {
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
      identificador: '',
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
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data.data;
      await login(token, user);
    } catch (error) {
      const details = error?.response?.data?.details?.errors;
      if (Array.isArray(details) && details.length > 0) {
        setServerError(details[0].msg || 'Por favor, verifica los campos del formulario.');
        return;
      }

      setServerError(error?.response?.data?.message || 'No habilitado para iniciar sesión. Por favor, contacte al administrador.');
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
              <h1 className="auth-title">Inicia sesion en Nuestro Sistema</h1>

              <div className="auth-socials">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Linkedin, label: 'Linkedin' },
                  { icon: X, label: 'X' }
                ].map(({ icon: Icon, label }) => (
                  <button key={label} type="button" className="auth-social-button" aria-label={label}>
                    <Icon className="icon-sm" />
                  </button>
                ))}
              </div>

              <p className="auth-note">O usa tu número de identificación</p>

              <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                <div>
                  <Input
                    type="text"
                    placeholder="Cédula"
                    className="auth-field"
                    {...register('identificador', {
                      required: 'Por favor, ingresa tu número de identificación.'
                    })}
                  />
                  {errors.identificador ? <p className="auth-error">{errors.identificador.message}</p> : null}
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

                <button type="button" className="auth-link-button">
                  Olvidaste tu contraseña?
                </button>

                <div className="auth-submit-wrap">
                  <button type="submit" disabled={isSubmitting} className="auth-submit">
                    {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    <LogIn className="icon-sm" />
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="auth-side">
            <div className="auth-side__content">
              <h2 className="auth-side__title">Bienvenidos !</h2>
              <p className="auth-side__text">Ingresa tus datos personales y comienza tu viaje con nosotros</p>

              <div className="auth-side__actions">
                <button type="button" onClick={() => navigate('/register')} className="auth-pill-button">
                  Registrarse
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
