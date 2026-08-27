'use client';
import {
  generateStrongPassword,
  getPasswordStrengthColor,
  getPasswordStrengthLevel,
  validatePasswordStrength,
} from '@/stores/base/utils/passwordUtilities';
import { createUserAction, CreateUserRequest } from '@/services/actions/user.actions';
import { getRolesAction, Role } from '@/services/actions/roles.actions';
import { ROLES_ASIGNABLES } from '@/configs/permisos';
import { EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces para el formulario
interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  userProfile: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  rut: string;
  businessName: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  secondLastName?: string;
  userProfile?: string;
  password?: string[];
  passwordConfirmation?: string;
  phone?: string;
  rut?: string;
  businessName?: string;
}

export default function CreateUser() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    secondLastName: '',
    userProfile: '',
    password: '',
    passwordConfirmation: '',
    phone: '',
    rut: '',
    businessName: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Formatear RUT mientras se escribe
  const formatRut = (value: string): string => {
    // Remover todos los caracteres no válidos excepto números y K
    let cleanValue = value.replace(/[^0-9Kk]/g, '');
    
    // Convertir a mayúsculas
    cleanValue = cleanValue.toUpperCase();
    
    // Si no hay valor, retornar vacío
    if (!cleanValue) return '';
    
    // Si solo hay un carácter y es K, no es válido
    if (cleanValue.length === 1 && cleanValue === 'K') return '';
    
    // Si hay más de 9 caracteres, truncar
    if (cleanValue.length > 9) {
      cleanValue = cleanValue.substring(0, 9);
    }
    
    // Separar cuerpo y dígito verificador
    const body = cleanValue.slice(0, -1);
    const dv = cleanValue.slice(-1);
    
    // Si el cuerpo está vacío, retornar solo el dígito verificador
    if (!body) return dv;
    
    // Formatear con guión
    return `${body}-${dv}`;
  };

  // Validar RUT chileno
  const isValidRut = (rut: string): boolean => {
    // Remover puntos y guión
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (cleanRut.length < 2) return false;
    
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    // Validar que el cuerpo sea numérico
    if (!/^\d+$/.test(body)) return false;
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDv = 11 - (sum % 11);
    let expectedDvStr = '';
    
    if (expectedDv === 11) expectedDvStr = '0';
    else if (expectedDv === 10) expectedDvStr = 'K';
    else expectedDvStr = expectedDv.toString();
    
    return dv === expectedDvStr;
  };

  // Validar formulario
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El primer apellido es requerido';
    }

    if (!formData.secondLastName.trim()) {
      newErrors.secondLastName = 'El segundo apellido es requerido';
    }

    if (!formData.userProfile) {
      newErrors.userProfile = 'Debe seleccionar un perfil de usuario';
    }

    if (!formData.password.trim()) {
      newErrors.password = ['La contraseña es requerida'];
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors;
      }
    }

    if (!formData.passwordConfirmation.trim()) {
      newErrors.passwordConfirmation = 'La confirmación de contraseña es requerida';
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Las contraseñas no coinciden';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    } else if (!isValidRut(formData.rut)) {
      newErrors.rut = 'El RUT no es válido';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'El nombre de la empresa es requerido';
    }

    return newErrors;
  };

  // Verificar si el formulario es válido
  const isFormValid = (): boolean => {
    const currentErrors = validateForm();
    return Object.keys(currentErrors).length === 0;
  };

  // Manejar cambios en los inputs
  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    let processedValue = value;
    
    // Aplicar formato especial para RUT
    if (field === 'rut' && typeof value === 'string') {
      processedValue = formatRut(value);
    }
    
    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    // Limpiar errores del campo cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Generar contraseña
  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword({
      length: 16,
      excludeSimilar: true,
    });
    setFormData((prev) => ({ 
      ...prev, 
      password: newPassword,
      passwordConfirmation: newPassword 
    }));

    // Limpiar errores de contraseña
    if (errors.password || errors.passwordConfirmation) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        delete newErrors.passwordConfirmation;
        return newErrors;
      });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para la API
      const userData: CreateUserRequest = {
        name: `${formData.firstName} ${formData.lastName} ${formData.secondLastName}`.trim(),
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
        phone: formData.phone,
        rut: formData.rut.replace(/\./g, ''), // Limpiar solo puntos, conservar guion
        business_name: formData.businessName,
        is_active: true,
        roles: [formData.userProfile],
      };

      const result = await createUserAction(userData);

      if (result.success) {
        // Redirigir a /users
        router.push('/super-admin/users');
        return;
      } else {
        setFormError(result.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setFormError('Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const result = await getRolesAction();
        if (result.success && result.data) {
          // Mostrar solo los roles que el panel ofrece en esta etapa
          const filteredRoles = result.data.filter(role =>
            ROLES_ASIGNABLES.includes(role.name)
          );
          setRoles(filteredRoles);
        } else {
          console.error('Error loading roles:', result.error);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  // Obtener validación de contraseña para mostrar nivel
  const passwordValidation = formData.password
    ? validatePasswordStrength(formData.password)
    : null;

  return (
    <form className="px-4 md:px-[40px] max-w-7xl" onSubmit={handleSubmit}>
      <div className="flex flex-col p-2 md:p-4 gap-4 md:gap-6">
        <p className="text-sm">Agregar los datos para crear un nuevo usuario</p>
        <div className="gap-4 md:gap-[27px] flex flex-col">
          {/* Primera fila - Email */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-[34px]">
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="email-create-user">
                Correo electrónico
              </label>
              <input
                id="email-create-user"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
              />
              {errors.email && (
                <span className="text-red-500 text-xs">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Segunda fila - Nombres y apellidos */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-[34px]">
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="firstname-create-user">
                Nombre
              </label>
              <input
                id="firstname-create-user"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
              />
              {errors.firstName && (
                <span className="text-red-500 text-xs">{errors.firstName}</span>
              )}
            </div>
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="lastname-create-user">
                Primer apellido
              </label>
              <input
                id="lastname-create-user"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
              />
              {errors.lastName && (
                <span className="text-red-500 text-xs">{errors.lastName}</span>
              )}
            </div>
            <div className="flex flex-col gap-[10px] w-full">
              <label
                className="text-[15px]"
                htmlFor="secondlastname-create-user"
              >
                Segundo apellido
              </label>
              <input
                id="secondlastname-create-user"
                type="text"
                value={formData.secondLastName}
                onChange={(e) =>
                  handleInputChange('secondLastName', e.target.value)
                }
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
              />
              {errors.secondLastName && (
                <span className="text-red-500 text-xs">
                  {errors.secondLastName}
                </span>
              )}
            </div>
          </div>

          {/* Tercera fila - Teléfono, RUT y Nombre de empresa */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-[34px]">
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="phone-create-user">
                Teléfono
              </label>
              <input
                id="phone-create-user"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
                placeholder="123456789"
              />
              {errors.phone && (
                <span className="text-red-500 text-xs">{errors.phone}</span>
              )}
            </div>
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="rut-create-user">
                RUT
              </label>
              <input
                id="rut-create-user"
                type="text"
                value={formData.rut}
                onChange={(e) => handleInputChange('rut', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
                placeholder="12312312-3"
              />
              {errors.rut && (
                <span className="text-red-500 text-xs">{errors.rut}</span>
              )}
            </div>
            <div className="flex flex-col gap-[10px] w-full">
              <label className="text-[15px]" htmlFor="businessname-create-user">
                Nombre de empresa
              </label>
              <input
                id="businessname-create-user"
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] w-full"
                placeholder="Mi Empresa"
              />
              {errors.businessName && (
                <span className="text-red-500 text-xs">{errors.businessName}</span>
              )}
            </div>
          </div>

          {/* Perfil de usuario */}
          <div className="flex flex-col md:flex-row md:gap-6 md:items-center gap-3">
            <p className="text-xs">Perfil de usuario</p>
            <div className="flex flex-col md:flex-row gap-4 md:gap-[48px] md:flex-1-0-0">
              {loadingRoles ? (
                <div className="text-xs text-gray-500">Cargando roles...</div>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="flex gap-2 items-center">
                    <label className="text-xs" htmlFor={`${role.name}-create-user`}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </label>
                    <input
                      className="text-xs"
                      type="radio"
                      name="userProfile"
                      id={`${role.name}-create-user`}
                      checked={formData.userProfile === role.name}
                      onChange={() => handleInputChange('userProfile', role.name)}
                    />
                  </div>
                ))
              )}
            </div>
            {errors.userProfile && (
              <span className="text-red-500 text-xs">{errors.userProfile}</span>
            )}
          </div>

          {/* Botón generar contraseña */}
          <div className="flex flex-col md:flex-row md:gap-6 md:items-center gap-3">
            <p className="text-xs">Contraseña</p>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-xs px-6 md:px-12 py-3 rounded-md border-slate-400 border-[1px] border-solid text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors ease-in-out duration-300 w-fit"
            >
              Generar contraseña
            </button>
          </div>

          {/* Campo de contraseña y botón mostrar/ocultar */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex flex-col gap-[6px] w-full md:w-auto">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 w-full md:min-w-[250px] h-[40px]"
                placeholder="Contraseña"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.passwordConfirmation}
                onChange={(e) => handleInputChange('passwordConfirmation', e.target.value)}
                className="bg-[#EBEFF7] text-[15px] px-2 py-1 w-full md:min-w-[250px] h-[40px]"
                placeholder="Confirmar contraseña"
              />
              <span
                className={`${
                  passwordValidation
                    ? getPasswordStrengthColor(passwordValidation.score)
                    : 'bg-gray-100'
                } p-[10px] h-[40px] text-center text-sm`}
              >
                {passwordValidation
                  ? getPasswordStrengthLevel(passwordValidation.score)
                  : 'Sin contraseña'}
              </span>
              {errors.password && (
                <div className="flex flex-col gap-1">
                  {errors.password.map((error, index) => (
                    <span key={index} className="text-red-500 text-xs">
                      {error}
                    </span>
                  ))}
                </div>
              )}
              {errors.passwordConfirmation && (
                <span className="text-red-500 text-xs">{errors.passwordConfirmation}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="px-6 md:px-12 py-3 text-xs flex gap-3 justify-center items-center border-solid rounded-md border-[1px] border-slate-400 text-slate-400 hover:bg-slate-100 transition-colors ease-in-out duration-300 h-[48px] cursor-pointer w-fit"
            >
              {showPassword ? (
                <>
                  <EyeSlashIcon width={24} height={24} />
                  Ocultar
                </>
              ) : (
                <>
                  <EyeIcon width={24} height={24} />
                  Mostrar
                </>
              )}
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-center">
            <button
              type="button"
              className="text-xs font-medium w-full md:min-w-[120px] md:w-auto px-6 md:px-12 py-3 border-[1px] border-slate-400 text-slate-400 rounded-md hover:bg-slate-100 transition-colors duration-300 ease-in-out cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className={`text-xs text-white font-medium w-full md:min-w-[120px] md:w-auto px-6 md:px-12 py-3 rounded-md transition-colors duration-300 ease-in-out ${
                isFormValid() && !isSubmitting
                  ? 'bg-lime-500 hover:bg-lime-600 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        {formError && (
          <div className="mt-4 text-center text-red-600 text-sm font-semibold">
            {formError}
          </div>
        )}
      </div>
    </form>
  );
}
