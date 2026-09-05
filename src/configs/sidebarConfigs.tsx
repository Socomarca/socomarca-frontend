'use client';

import { SidebarConfig } from '@/interfaces/sidebar.interface';
import ModalLogout from '@/app/components/mi-cuenta/ModalLogout';

export const createLogoutModal = (
  onLogout: () => Promise<void>,
  onCancel: () => void
) => (
  <ModalLogout
    onClose={onCancel}
    onLogout={onLogout}
    dataCyConfirm="confirm-logout-btn"
    dataCyCancel="cancel-logout-btn"
  />
);

export const getSidebarConfig = (
  userRole: 'admin' | 'superadmin',
  openModal: (id: string, config: any) => void,
  closeModal: () => void,
  router: { push: (url: string) => void },
  logoutFunction: () => Promise<void>
): SidebarConfig => {
  const handleLogout = async (): Promise<void> => {
    await logoutFunction();
    closeModal();
    router.push('/auth/login');
  };

  const baseItems = [
    {
      id: 'sales-report',
      label: 'Reporte de ventas',
      submenu: [
        { name: 'Total de ventas', url: '/admin/total-de-ventas' },
        {
          name: 'Transacciones exitosas',
          url: '/admin/transacciones-exitosas',
        },
        { name: 'Clientes con más compras', url: '/admin/clientes-mas-compra' },
        {
          name: 'Productos con más ventas',
          url: '/admin/productos-mas-ventas',
        },
        { name: 'Comunas con más ventas', url: '/admin/comunas-mas-ventas' },
        {
          name: 'Categoría con más ventas',
          url: '/admin/categoria-mas-ventas',
        },
        {
          name: 'Transacciones fallidas o canceladas',
          url: '/admin/transacciones-fallidas',
        },
      ],
    },
    {
      id: 'productos',
      label: 'Productos',
      url: '/admin/productos',
    },
    {
      id: 'carga-masiva',
      label: 'Carga Masiva',
      url: '/admin/carga-masiva',
    },
    {
      id: 'categorias',
      label: 'Categorías',
      url: '/admin/categorias',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      url: '/admin/clientes',
    },
    {
      id: 'info-sitio',
      label: 'Información del sitio',
      url: '/admin/informacion-sitio',
    },
    {
      id: 'terminos',
      label: 'Términos y condiciones',
      url: '/admin/terminos-condiciones',
    },
    {
      id: 'politicas',
      label: 'Políticas y privacidad',
      url: '/admin/politicas-privacidad',
    },
    {
      id: 'faq',
      label: 'Preguntas frecuentes',
      url: '/admin/preguntas-frecuentes',
    },
    {
      id: 'iva',
      label: 'IVA',
      url: '/admin/iva',
    },
    {
      id: 'mensaje-cliente',
      label: 'Mensaje para el cliente',
      url: '/admin/mensaje-cliente',
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      url: '/admin/notificaciones',
    },
    {
      id: 'Regiones y comunas',
      label: 'Regiones y comunas',
      url: '/admin/regiones',
    },
    {
      id: 'cambio-clave',
      label: 'Cambio de clave',
      url: '/admin/cambio-clave',
    },
  ];

  // Items exclusivos para superadmin
  const superAdminItems = [
    {
      id: 'users',
      label: 'Usuarios',
      url: '/super-admin/users',
    },
    {
      id: 'create-user',
      label: 'Crear nuevo usuario',
      url: '/super-admin/create-user',
    },
    {
      id: 'Transbank',
      label: 'Transbank',
      url: '/super-admin/transbank',
    },
  ];

  const logoutItem = {
    id: 'cerrar-sesion',
    label: 'Cerrar sesión',
    onClick: () => {
      openModal('logout', {
        title: 'Cerrar sesión',
        size: 'md',
        content: createLogoutModal(handleLogout, closeModal),
      });
    },
  };

  const items = [
    ...baseItems,
    ...(userRole === 'superadmin' ? superAdminItems : []),
    logoutItem,
  ];
  return { items };
};
