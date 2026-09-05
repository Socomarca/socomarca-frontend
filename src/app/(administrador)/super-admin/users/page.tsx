'use client';

import CustomTable from '@/app/components/admin/CustomTable';
import Pagination from '@/app/components/global/Pagination';
import Search from '@/app/components/global/Search';
import { TableColumn } from '@/interfaces/dashboard.interface';
import useStore from '@/stores/base';
import {
  generateStrongPassword,
  getPasswordStrengthColor,
  getPasswordStrengthLevel,
  validatePasswordStrength,
} from '@/stores/base/utils/passwordUtilities';
import {
  PencilSquareIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { getUsersAction, searchUsersAction, updateUserAction, deleteUserAction, UpdateUserRequest } from '@/services/actions/user.actions';
import { getRolesAction, Role } from '@/services/actions/roles.actions';
import { ROLES_ASIGNABLES } from '@/configs/permisos';
import { transformApiUserToUser, ApiMeta, SearchUsersRequest } from '@/interfaces/user.interface';

export interface User {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  profile: string;
  rut: string;
  business_name?: string;
  phone?: string;
  actions?: string[];
}

// Interfaces para el formulario de edición
interface EditFormData {
  email: string;
  firstName: string;
  lastName: string;
  rut: string;
  businessName: string;
  phone: string;
  userProfile: string;
  password: string;
  changePassword: boolean;
}

interface EditFormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  userProfile?: string;
  password?: string[];
  rut?: string;
  businessName?: string;
  phone?: string;
}

// Componente Skeleton para la tabla
const TableSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header de la tabla */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Filas de la tabla */}
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



// Componente del modal de eliminación
const DeleteUserModal = ({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        ¿Estás seguro de que deseas eliminar al usuario{' '}
        <strong>{user.username}</strong>?
      </p>
      <p className="text-xs text-gray-600">
        Esta acción no se puede deshacer. Se eliminará toda la información
        asociada al usuario.
      </p>
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Información del usuario:
        </h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>
            <strong>Nombre:</strong> {user.name} {user.lastname}
          </li>
          <li>
            <strong>Email:</strong> {user.email}
          </li>
          <li>
            <strong>Perfil:</strong> {user.profile}
          </li>
        </ul>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar usuario'}
        </button>
      </div>
    </div>
  );
};

// Componente del formulario de edición
const EditUserForm = ({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    email: user.email,
    firstName: user.name,
    lastName: user.lastname,
    rut: user.rut,
    businessName: user.business_name || '',
    phone: user.phone || '',
    userProfile: user.profile.toLowerCase(),
    password: '',
    changePassword: false,
  });

  const [errors, setErrors] = useState<EditFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

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
  const validateForm = (): EditFormErrors => {
    const newErrors: EditFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    } else if (!isValidRut(formData.rut)) {
      newErrors.rut = 'El RUT no es válido';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'La empresa es requerida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.userProfile) {
      newErrors.userProfile = 'Debe seleccionar un perfil de usuario';
    }

    if (formData.changePassword) {
      if (!formData.password.trim()) {
        newErrors.password = ['La contraseña es requerida'];
      } else {
        const passwordValidation = validatePasswordStrength(formData.password);
        if (!passwordValidation.isValid) {
          newErrors.password = passwordValidation.errors;
        }
      }
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
    field: keyof EditFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar errores del campo cuando el usuario empiece a escribir
    if (errors[field as keyof EditFormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof EditFormErrors];
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
    setFormData((prev) => ({ ...prev, password: newPassword }));

    // Limpiar errores de contraseña
    if (errors.password) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para la API
      const updateData: UpdateUserRequest = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        rut: formData.rut,
        business_name: formData.businessName,
        is_active: true, // Por defecto activo
        roles: [formData.userProfile], // Convertir perfil a rol
      };

      // Agregar contraseña si se está cambiando
      if (formData.changePassword && formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password;
      }

      // Log de los datos y claves que van al backend
      console.log('Datos enviados al backend para actualización de usuario:', updateData);

      const result = await updateUserAction(user.id, updateData);

      if (result.success) {
        console.log('Usuario actualizado exitosamente:', result.data);
        onSuccess();
        onClose();
      } else {
        console.error('Error al actualizar usuario:', result.error);
        // Aquí podrías mostrar un mensaje de error más específico
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
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
          setRoles(result.data.filter(role => ROLES_ASIGNABLES.includes(role.name)));
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
  const passwordValidation =
    formData.password && formData.changePassword
      ? validatePasswordStrength(formData.password)
      : null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[#6D7587] mb-2">
          Editar información del usuario <strong>{user.username}</strong>
        </p>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="email-edit">
            Correo electrónico
          </label>
          <input
            id="email-edit"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
          />
          {errors.email && (
            <span className="text-red-500 text-xs">{errors.email}</span>
          )}
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="name-edit">
            Nombre
          </label>
          <input
            id="name-edit"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
          />
          {errors.firstName && (
            <span className="text-red-500 text-xs">{errors.firstName}</span>
          )}
        </div>

        {/* Apellido */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="lastname-edit">
            Apellido
          </label>
          <input
            id="lastname-edit"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
          />
          {errors.lastName && (
            <span className="text-red-500 text-xs">{errors.lastName}</span>
          )}
        </div>
        {/* RUT */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="rut-edit">
            RUT
          </label>
          <input
            id="rut-edit"
            type="text"
            value={formData.rut}
            onChange={(e) => handleInputChange('rut', formatRut(e.target.value))}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
            placeholder="12345678-9"
            maxLength={10}
          />
          {errors.rut && (
            <span className="text-red-500 text-xs">{errors.rut}</span>
          )}
        </div>
        {/* Empresa */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="businessname-edit">
            Empresa
          </label>
          <input
            id="businessname-edit"
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
          />
          {errors.businessName && (
            <span className="text-red-500 text-xs">{errors.businessName}</span>
          )}
        </div>
        {/* Teléfono */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px]" htmlFor="phone-edit">
            Teléfono
          </label>
          <input
            id="phone-edit"
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="rounded bg-[#EBEFF7] px-2 py-1 h-[40px]"
          />
          {errors.phone && (
            <span className="text-red-500 text-xs">{errors.phone}</span>
          )}
        </div>

        {/* Perfil de usuario */}
        <div className="flex flex-col gap-3">
          <span className="text-[15px]">Perfil de usuario</span>
          <div className="flex flex-col gap-2">
            {loadingRoles ? (
              <div className="text-sm text-gray-500">Cargando roles...</div>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="flex gap-2 items-center">
                  <input
                    type="radio"
                    name="userProfile"
                    id={`${role.name}-edit`}
                    checked={formData.userProfile === role.name}
                    onChange={() => handleInputChange('userProfile', role.name)}
                  />
                  <label className="text-sm" htmlFor={`${role.name}-edit`}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </label>
                </div>
              ))
            )}
          </div>
          {errors.userProfile && (
            <span className="text-red-500 text-xs">{errors.userProfile}</span>
          )}
        </div>

        {/* Cambiar contraseña */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              id="change-password"
              checked={formData.changePassword}
              onChange={(e) =>
                handleInputChange('changePassword', e.target.checked)
              }
            />
            <label className="text-sm" htmlFor="change-password">
              Cambiar contraseña
            </label>
          </div>

          {formData.changePassword && (
            <div className="space-y-3">
              {/* Botón generar contraseña */}
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs px-6 py-2 rounded-md border-slate-400 border-[1px] border-solid text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors ease-in-out duration-300"
              >
                Generar contraseña
              </button>

              {/* Campo de contraseña */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    className="bg-[#EBEFF7] text-[15px] px-2 py-1 h-[40px] rounded"
                    placeholder="Nueva contraseña"
                  />
                  {passwordValidation && (
                    <span
                      className={`${getPasswordStrengthColor(
                        passwordValidation.score
                      )} p-2 text-center text-sm rounded`}
                    >
                      {getPasswordStrengthLevel(passwordValidation.score)}
                    </span>
                  )}
                  {errors.password && (
                    <div className="flex flex-col gap-1">
                      {errors.password.map((error, index) => (
                        <span key={index} className="text-red-500 text-xs">
                          {error}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 text-xs flex gap-2 justify-center items-center border-solid rounded-md border-[1px] border-slate-400 text-slate-400 hover:bg-slate-100 transition-colors ease-in-out duration-300 h-[40px] cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeSlashIcon width={16} height={16} />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <EyeIcon width={16} height={16} />
                      Mostrar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium px-6 py-2 border-[1px] border-slate-400 text-slate-400 rounded-md hover:bg-slate-100 transition-colors duration-300 ease-in-out cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`text-sm text-white font-medium px-6 py-2 rounded-md transition-colors duration-300 ease-in-out ${
              isFormValid() && !isSubmitting
                ? 'bg-lime-500 hover:bg-lime-600 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  );
};

// Componente principal
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [perPage] = useState(10);
  const [deletingUsers, setDeletingUsers] = useState<Set<number>>(new Set());

  const { openModal, closeModal } = useStore();

  // Función para cargar usuarios
  const loadUsers = useCallback(async (page: number = 1, search: string = '') => {
    if (search.trim()) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let result;
      
      if (search.trim()) {
        // Usar búsqueda si hay término de búsqueda
        const searchRequest: SearchUsersRequest = {
          filters: [
            {
              field: 'name',
              operator: 'ILIKE',
              value: `%${search}%`
            }
          ],
          roles: [], // Buscar en todos los roles
          per_page: perPage
        };
        
        result = await searchUsersAction(searchRequest);
      } else {
        // Usar listado normal si no hay búsqueda
        result = await getUsersAction({
          page,
          per_page: perPage,
        });
      }

      if (result.success && result.data) {
        // Transformar los datos de la API al formato del componente
        const apiUsers = Array.isArray(result.data.data) ? result.data.data : [];
        const transformedUsers = apiUsers.map((apiUser: any) => transformApiUserToUser(apiUser));
        setUsers(transformedUsers);
        setMeta(result.data.meta);
      } else {
        setError(result.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error inesperado al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [perPage]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadUsers]);

  // Manejar búsqueda
  const onSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Resetear a la primera página
    loadUsers(1, search);
  };

  const onClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadUsers(1, '');
  };

  // Manejar cambio de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteUser = (user: User) => {
    openModal('delete-user', {
      title: `Confirmar eliminación`,
      size: 'sm',
      content: (
        <DeleteUserModal
          user={user}
          onConfirm={() => confirmDeleteUser(user)}
          onCancel={closeModal}
        />
      ),
    });
  };

  const confirmDeleteUser = async (user: User) => {
    // Optimistic update: remover usuario de la lista inmediatamente
    setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
    setDeletingUsers(prev => new Set(prev).add(user.id));
    
    try {
      const result = await deleteUserAction(user.id);
      
      if (result.success) {
        console.log('Usuario eliminado:', user);
        closeModal();
        // No necesitamos recargar la lista porque ya hicimos optimistic update
      } else {
        // Si falló, revertir el optimistic update
        setUsers(prevUsers => [...prevUsers, user]);
        console.error('Error al eliminar usuario:', result.error);
      }
    } catch (error) {
      // Si falló, revertir el optimistic update
      setUsers(prevUsers => [...prevUsers, user]);
      console.error('Error al eliminar usuario:', error);
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const handleEditUser = (user: User) => {
    openModal('edit-user', {
      title: 'Editar usuario',
      size: 'md',
      content: (
        <EditUserForm
          user={user}
          onClose={() => {
            closeModal();
          }}
          onSuccess={() => {
            // Recargar la lista después de editar exitosamente
            loadUsers(currentPage, searchTerm);
          }}
        />
      ),
    });
  };

  const usersColumns: TableColumn<User>[] = [
    {
      label: 'ID',
      key: 'id',
    },
    {
      label: 'RUT',
      key: 'rut',
    },
    {
      label: 'Correo electrónico',
      key: 'email',
    },
    {
      label: 'Perfil',
      key: 'profile',
    },
    {
      label: 'Acciones',
      key: 'actions',
      render: (actions, user) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            className="text-lime-500 hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => handleEditUser(user)}
            disabled={deletingUsers.has(user.id)}
          >
            <PencilSquareIcon width={16} height={16} />
            Editar
          </button>
          <button
            className="text-lime-500 hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => handleDeleteUser(user)}
            disabled={deletingUsers.has(user.id)}
          >
            <TrashIcon width={16} height={16} />
            {deletingUsers.has(user.id) ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      ),
    },
  ];

  // Crear metadatos de paginación para el componente Pagination
  const paginationMeta = meta ? {
    current_page: meta.current_page,
    last_page: meta.last_page,
    per_page: meta.per_page,
    total: meta.total,
    from: meta.from,
    to: meta.to,
    links: meta.links,
    path: meta.path,
  } : null;

  // Mostrar skeleton solo en la carga inicial
  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
        <Search
          onClear={onClear}
          onSearch={onSearch}
          showLabel={false}
          placeholder="Buscar por nombre / correo electrónico"
        />
        <div className="px-4">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
        <Search
          onClear={onClear}
          onSearch={onSearch}
          showLabel={false}
          placeholder="Buscar por nombre / correo electrónico"
        />
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">Error: {error}</div>
          <button
            onClick={() => loadUsers(currentPage, searchTerm)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
      <Search
        onClear={onClear}
        onSearch={onSearch}
        showLabel={false}
        placeholder="Buscar por nombre / correo electrónico"
      />
      <div className="px-4 relative">
        {/* Overlay de loading para búsqueda */}
        {searchLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-500"></div>
              <span className="text-gray-600">Buscando...</span>
            </div>
          </div>
        )}
        
        <CustomTable data={users} columns={usersColumns} />
      </div>
      {paginationMeta && (
        <div className="px-4">
          <Pagination meta={paginationMeta} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}