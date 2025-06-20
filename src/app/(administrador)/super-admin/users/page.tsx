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
import { useState, useEffect } from 'react';
import { getUsersAction } from '@/services/actions/user.actions';
import { transformApiUserToUser, ApiMeta } from '@/interfaces/user.interface';

export interface User {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  profile: string;
  actions?: string[];
}

// Interfaces para el formulario de edición
interface EditFormData {
  email: string;
  firstName: string;
  lastName: string;
  userProfile: 'colaborador' | 'editor' | 'administrador' | '';
  password: string;
  changePassword: boolean;
}

interface EditFormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  userProfile?: string;
  password?: string[];
}

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
}: {
  user: User;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    email: user.email,
    firstName: user.name,
    lastName: user.lastname,
    userProfile: user.profile.toLowerCase() as
      | 'colaborador'
      | 'editor'
      | 'administrador',
    password: '',
    changePassword: false,
  });

  const [errors, setErrors] = useState<EditFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Usuario actualizado:', formData);
      alert('Usuario actualizado exitosamente!');
      onClose();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Perfil de usuario */}
        <div className="flex flex-col gap-3">
          <span className="text-[15px]">Perfil de usuario</span>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input
                type="radio"
                name="userProfile"
                id="colaborador-edit"
                checked={formData.userProfile === 'colaborador'}
                onChange={() => handleInputChange('userProfile', 'colaborador')}
              />
              <label className="text-sm" htmlFor="colaborador-edit">
                Colaborador
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="radio"
                name="userProfile"
                id="editor-edit"
                checked={formData.userProfile === 'editor'}
                onChange={() => handleInputChange('userProfile', 'editor')}
              />
              <label className="text-sm" htmlFor="editor-edit">
                Editor
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="radio"
                name="userProfile"
                id="administrador-edit"
                checked={formData.userProfile === 'administrador'}
                onChange={() =>
                  handleInputChange('userProfile', 'administrador')
                }
              />
              <label className="text-sm" htmlFor="administrador-edit">
                Administrador
              </label>
            </div>
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
  const [error, setError] = useState<string | null>(null);
  //const [selectedUser, setSelectedUser] = useState<User | null>(null);
  //const [modalAction, setModalAction] = useState<'edit' | 'delete' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [perPage] = useState(10);

  const { openModal, closeModal } = useStore();

  // Función para cargar usuarios
  const loadUsers = async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUsersAction({
        page,
        per_page: perPage,
      });

      if (result.success && result.data) {
        // Transformar los datos de la API al formato del componente
        const transformedUsers = result.data.data.map(transformApiUserToUser);
        
        // Filtrar por término de búsqueda si existe
        let filteredUsers = transformedUsers;
        if (search.trim()) {
          filteredUsers = transformedUsers.filter(
            (user) =>
              user.name.toLowerCase().includes(search.toLowerCase()) ||
              user.lastname.toLowerCase().includes(search.toLowerCase()) ||
              user.email.toLowerCase().includes(search.toLowerCase()) ||
              user.username.toLowerCase().includes(search.toLowerCase())
          );
        }

        setUsers(filteredUsers);
        setMeta(result.data.meta);
      } else {
        setError(result.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error inesperado al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers(currentPage, searchTerm);
  }, [currentPage]);

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
    //setSelectedUser(user);
    //setModalAction('delete');
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
    try {
      // Simular llamada al backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Usuario eliminado:', user);
      alert(`Usuario ${user.username} eliminado exitosamente`);
      closeModal();
      // Recargar la lista después de eliminar
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleEditUser = (user: User) => {
    //setSelectedUser(user);
    //setModalAction('edit');
    openModal('edit-user', {
      title: 'Editar usuario',
      size: 'md',
      content: (
        <EditUserForm
          user={user}
          onClose={() => {
            closeModal();
            // Recargar la lista después de editar
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
      label: 'Nombre de usuario',
      key: 'username',
    },
    {
      label: 'Nombre',
      key: 'name',
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
          >
            <PencilSquareIcon width={16} height={16} />
            Editar
          </button>
          <button
            className="text-lime-500 hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => handleDeleteUser(user)}
          >
            <TrashIcon width={16} height={16} />
            Eliminar
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

  if (loading) {
    return (
      <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 max-w-7xl mx-auto w-full">
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
      <div className="px-4">
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