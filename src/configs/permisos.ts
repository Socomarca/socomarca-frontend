/**
 * Configuración de permisos del sistema
 * Define qué permisos son necesarios para acceder a diferentes funcionalidades
 */

export const PERMISOS = {
  // Permisos para gestión de productos
  PRODUCTS: {
    CREATE: 'create-product',
    READ: 'read-product',
    UPDATE: 'update-product',
    DELETE: 'delete-product',
    SYNC_IMAGES: 'sync-product-images',
  },
  
  // Permisos para gestión de categorías
  CATEGORIES: {
    CREATE: 'create-category',
    READ: 'read-category',
    UPDATE: 'update-category',
    DELETE: 'delete-category',
  },
  
  // Permisos para gestión de clientes
  CLIENTS: {
    READ: 'read-client',
    UPDATE: 'update-client',
    DELETE: 'delete-client',
  },
  
  // Permisos para reportes
  REPORTS: {
    SALES: 'read-sales-report',
    CLIENTS: 'read-clients-report',
    PRODUCTS: 'read-products-report',
  },
  
  // Permisos para gestión del sitio
  SITE: {
    UPDATE_INFO: 'update-site-info',
    UPDATE_TERMS: 'update-terms',
    UPDATE_PRIVACY: 'update-privacy',
    UPDATE_FAQ: 'update-faq',
  },
  
  // Permisos para notificaciones
  NOTIFICATIONS: {
    CREATE: 'create-notification',
    READ: 'read-notification',
    UPDATE: 'update-notification',
    DELETE: 'delete-notification',
  },
  
  // Permisos para gestión de usuarios (superadmin)
  USERS: {
    CREATE: 'create-user',
    READ: 'read-user',
    UPDATE: 'update-user',
    DELETE: 'delete-user',
    MANAGE_ROLES: 'manage-user-roles',
  },
} as const;

/**
 * Verifica si un usuario tiene un permiso específico
 * @param userPermissions - Array de permisos del usuario
 * @param requiredPermission - Permiso requerido
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export const hasPermission = (
  userPermissions: string[] | null,
  requiredPermission: string
): boolean => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  return userPermissions.includes(requiredPermission);
};

/**
 * Verifica si un usuario tiene al menos uno de los permisos requeridos
 * @param userPermissions - Array de permisos del usuario
 * @param requiredPermissions - Array de permisos requeridos (al menos uno)
 * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
 */
export const hasAnyPermission = (
  userPermissions: string[] | null,
  requiredPermissions: string[]
): boolean => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};

/**
 * Verifica si un usuario tiene todos los permisos requeridos
 * @param userPermissions - Array de permisos del usuario
 * @param requiredPermissions - Array de permisos requeridos (todos)
 * @returns true si el usuario tiene todos los permisos, false en caso contrario
 */
export const hasAllPermissions = (
  userPermissions: string[] | null,
  requiredPermissions: string[]
): boolean => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
};

/**
 * Roles que el panel ofrece al crear o editar un usuario.
 *
 * El backend define seis (superadmin, admin, supervisor, editor, customer,
 * developer), pero en esta etapa solo se usan dos. Los demás siguen existiendo
 * con todos sus permisos y los usuarios que ya los tengan no se ven afectados:
 * acá solo se decide qué se muestra en los formularios.
 *
 * Para volver a ofrecer alguno, agregar su nombre a esta lista.
 */
export const ROLES_ASIGNABLES = ['superadmin', 'admin'];
