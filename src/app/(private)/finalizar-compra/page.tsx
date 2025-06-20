'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutInput from '@/app/components/global/RutInputVisualIndicators';
import Image from 'next/image';
import useStore from '@/stores/base';
import TerminosYCondicionesContent from '@/app/components/global/TerminosYCondicionesContent';
import {getUserData} from '@/services/actions/user.actions';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import ShippingAddressSelect from '@/app/components/user/ShippingAddressSelect';



export default function FinalizarCompraPage() {
  const router = useRouter();
  const cartProducts = useStore((state) => state.cartProducts);
  const [loadingUser, setLoadingUser] = useState(true);
  const { openModal } = useStore();
  const [direccionError, setDireccionError] = useState('');
  const [terminosError, setTerminosError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
  nombre: '',
  rut: '',
  correo: '',
  telefono: '',
  region: '',
  comuna: '',
  direccion: '',
  detallesDireccion: '',
  shippingAddressId: null as number | null, 
});
  const [aceptaTerminos, setAceptaTerminos] = useState(true);
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAceptaTerminos(e.target.checked);
  };
  const validarEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarTelefono = (telefono: string) =>
    /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/.test(telefono);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validaciones en tiempo real
    setErrors((prev) => {
      const newErrors = { ...prev };

      if (name === 'correo') {
        if (!validarEmail(value)) {
          newErrors.correo = 'Correo inválido';
        } else {
          delete newErrors.correo;
        }
      }

      if (name === 'telefono') {
        if (!validarTelefono(value)) {
          newErrors.telefono = 'Teléfono chileno inválido';
        } else {
          delete newErrors.telefono;
        }
      }

      return newErrors;
    });
  };

  // Manejador específico para el cambio del RUT
  const handleRutChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rut: value }));
  };

  const totalQuantity = cartProducts.reduce((sum, item) => sum + item.quantity, 0);

const totalAmount = cartProducts.reduce(
  (sum, item) => sum + item.quantity * item.price,
  0
);
const shippingCost = totalAmount * 0.1;
const formattedShipping = shippingCost.toLocaleString('es-CL', {
  style: 'currency',
  currency: 'CLP',
});
const subtotal = cartProducts.reduce(
  (sum, item) => sum + item.quantity * item.price,
  0
);

const shipping = subtotal * 0.1;
const total = subtotal + shipping;

const formatCLP = (value: number) =>
  value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

  // Manejador para la validación del RUT
  const handleRutValidation = (isValid: boolean) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!isValid && formData.rut) {
        newErrors.rut = 'RUT inválido';
      } else {
        delete newErrors.rut;
      }
      return newErrors;
    });
  };

  const handleOpenModal = () => {
    openModal('', {
      content: <TerminosYCondicionesContent />,
      showCloseButton: true,
      size: 'xl',
    });
  };

const goNext = () => {
  let hasError = false;

  if (!formData.shippingAddressId) {
    setDireccionError('Debes seleccionar una dirección de envío.');
    hasError = true;
  } else {
    setDireccionError('');
  }

  if (!aceptaTerminos) {
    setTerminosError('Debes aceptar los términos y condiciones.');
    hasError = true;
  } else {
    setTerminosError('');
  }

  if (hasError) return;

  if (formData.shippingAddressId !== null) {
    localStorage.setItem('selectedAddressId', formData.shippingAddressId.toString());
    router.push('/redirect');
  }
};



  useEffect(() => {
  const fetchUserData = async () => {
    try {
      const userData = await getUserData();
      setFormData((prev) => ({
        ...prev,
        nombre: userData.name || '',
        rut: userData.rut || '',
        correo: userData.email || '',
        telefono: userData.phone || '',
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingUser(false);
    }
  };
  fetchUserData();
}, []);


  return (
    <div className="bg-[#f1f5f9] min-h-screen p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Formulario de facturación */}
        <div className="w-full lg:w-2/3 bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-2xl font-bold mb-6">Datos de facturación</h2>
          {loadingUser ?
          (
    <div className="flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
          : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block font-medium">
        Nombre completo
      </label>
      <input
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
    </div>

    <div>
      <label className="block font-medium">
        Rut
      </label>
      <RutInput
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        name="rut"
        value={formData.rut}
        onChange={handleRutChange}
        onValidationChange={handleRutValidation}
        errorMessage="RUT inválido"
        disabled
      />
    </div>

    <div>
      <label className="block font-medium">
        Correo electrónico
      </label>
      <input
        type="email"
        name="correo"
        value={formData.correo}
        onChange={handleChange}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
      {errors.correo && (
        <p className="text-red-500 text-sm mt-1">{errors.correo}</p>
      )}
    </div>

    <div>
      <label className="block font-medium">
        Teléfono
      </label>
       <input
        type="text"
        name="telefono"
        value={'+56 ' + formData.telefono}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
      {errors.telefono && (
        <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
      )}
    </div>

    {/* <div>
      <label className="block font-medium">
        Región
      </label>
       <input
        type="text"
        name="region"
        value={formData.region}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
    </div>
      <div>
      <label className="block font-medium">
        Comuna
      </label>
       <input
        type="text"
        name="comuna"
        value={formData.comuna}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
    </div>

    <div>
      <label className="block font-medium">
        Dirección
      </label>
      <input
        type="text"
        name="direccion"
        value={formData.direccion}
        onChange={handleChange}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
    </div>

    <div>
      <label className="block font-medium">Detalles de la dirección</label>
      <input
        type="text"
        name="detallesDireccion"
        value={formData.detallesDireccion}
        onChange={handleChange}
        className="w-full p-2 mt-1 rounded bg-[#EBEFF7]"
        disabled
      />
    </div>*/}

 <div className="col-span-1 md:col-span-2 mt-8">
    <h2 className="text-2xl font-bold mb-2">Información de envío</h2>
  </div>

  <div className="col-span-1 md:col-span-2">
  <ShippingAddressSelect
    selectedAddressId={formData.shippingAddressId}
    onChange={(id) => {
      setFormData({ ...formData, shippingAddressId: id });
      if (id) setDireccionError('');
    }}
  />
  {direccionError && (
    <p className="text-red-500 text-sm mt-1">{direccionError}</p>
  )}
</div>

  </div>
)}

        </div>

        {/* Resumen de la orden */}
        <aside className="w-full lg:w-1/3 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Tu Orden</h3>

          <div className="flex justify-between border-t-slate-200 border-t py-5">
            <span>Productos ({totalQuantity})</span>
            <span className="text-black"></span>
          </div>
          <div className="flex justify-between border-t-slate-200 border-t py-5 ">
            <span className="font-bold">Subtotal</span>
            <span className="font-bold">{subtotal.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</span>
          </div>
          <div className="flex justify-between mb-5">
            <span>Costos de envío</span>
            <span>{formattedShipping}</span>
          </div>
          <div className="flex justify-between font-bold text-lg  border-t-slate-200 border-t py-5">
            <span>Total a pagar</span>
            <span>{formatCLP(total)}</span>
          </div>

          <div className="mb-4 border-t-slate-200 border-t py-5">
            <p className="font-bold">
              Pagar con Webpay (Tarjeta de Crédito y Débito)
            </p>
            <Image
              width={104}
              height={27}
              style={{ width: '150px', height: 'auto' }}
              src="/assets/global/logo_webpay.png"
              alt="Webpay"
              className="my-2 w-[40%] max-w-xs"
              unoptimized
            />
            <p className="text-sm text-neutral-950">
              Pagar con Redcompra
              <br />
              Serás redirigido al portal de WebPay
            </p>
          </div>

          <div className="text-sm text-gray-600 mb-4">
  <input
    type="checkbox"
    name="acepta"
    id="acepta"
    className="mr-2"
    checked={aceptaTerminos}
    onChange={handleCheckboxChange}
  />
  Todos los derechos reservados tankandtrailco.cl
  <br />
  Al comprar aceptas los{' '}
  <span
    onClick={handleOpenModal}
    className="text-lime-500 cursor-pointer"
  >
    términos y condiciones
  </span>{' '}
  de tankandtrailco.cl

  {terminosError && (
    <p className="text-red-500 text-sm mt-1">{terminosError}</p>
  )}
</div>


          <button
            onClick={goNext}
            className="w-full bg-lime-500 hover:bg-lime-600 text-white py-2 rounded cursor-pointer"
          >
            Finalizar compra
          </button>
        </aside>
      </div>
    </div>
  );
}
