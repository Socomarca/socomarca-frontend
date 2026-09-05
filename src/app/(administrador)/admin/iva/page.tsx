'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { hasPermission, PERMISOS } from '@/configs/permisos';
import useAuthStore from '@/stores/useAuthStore';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import {
  fetchGetVatRate,
  fetchUpdateVatRate,
} from '@/services/actions/vat.actions';

/**
 * Configuración de la tasa de IVA.
 *
 * La tasa se guarda como porcentaje y empieza a regir en el siguiente listado
 * de productos y en la siguiente orden: las órdenes ya emitidas conservan la
 * tasa con la que se cobraron.
 */
export default function IvaPage() {
  const router = useRouter();
  const { getUserPermissions } = useAuthStore();

  const [hasAccess, setHasAccess] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  const [rate, setRate] = useState('');
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userPermissions = getUserPermissions();

    if (!hasPermission(userPermissions, PERMISOS.CONTENT_SETTINGS.READ)) {
      router.push('/acceso-denegado');
      return;
    }

    setHasAccess(true);
    setCanUpdate(
      hasPermission(userPermissions, PERMISOS.CONTENT_SETTINGS.UPDATE)
    );
    setIsCheckingPermissions(false);
  }, [getUserPermissions, router]);

  useEffect(() => {
    if (!hasAccess) return;

    const loadRate = async () => {
      setIsLoading(true);

      const result = await fetchGetVatRate();

      if (result.ok && result.data !== null) {
        setCurrentRate(result.data);
        setRate(result.data.toString());
      } else {
        setError(result.error || 'No se pudo leer la tasa de IVA');
      }

      setIsLoading(false);
    };

    loadRate();
  }, [hasAccess]);

  /** La tasa es un porcentaje entre 0 y 100, igual que valida el backend. */
  const validate = (value: string): string => {
    if (value.trim() === '') return 'Ingresa la tasa de IVA';

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) return 'La tasa debe ser un número';
    if (parsed < 0 || parsed > 100) return 'La tasa debe estar entre 0 y 100';

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validate(rate);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    const result = await fetchUpdateVatRate(Number(rate));

    if (result.ok) {
      setCurrentRate(Number(rate));
      setSuccessMessage(result.data || 'Configuración actualizada correctamente');
    } else {
      setError(result.error || 'No se pudo actualizar la tasa de IVA');
    }

    setIsSaving(false);
  };

  if (isCheckingPermissions || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">IVA</h1>
      <p className="text-sm text-gray-600 mb-6">
        Tasa de IVA que se aplica a los precios que ve el cliente y a las órdenes
        nuevas. Las órdenes ya emitidas conservan la tasa con la que se cobraron.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-600">
          <LoadingSpinner />
          <span>Cargando la tasa vigente...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6">
          {currentRate !== null && (
            <p className="text-sm text-gray-500 mb-4">
              Tasa vigente: <strong>{currentRate}%</strong>
            </p>
          )}

          <label
            htmlFor="vat-rate"
            className="block text-sm font-semibold mb-2"
          >
            Tasa de IVA (%)
          </label>
          <input
            id="vat-rate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={rate}
            disabled={!canUpdate || isSaving}
            onChange={(e) => {
              setRate(e.target.value);
              setError('');
              setSuccessMessage('');
            }}
            className="w-full md:w-48 p-2 rounded bg-[#EBEFF7] disabled:opacity-60"
          />

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          {successMessage && (
            <p className="flex items-center gap-2 text-sm text-lime-600 mt-3">
              <CheckCircleIcon className="w-5 h-5" />
              {successMessage}
            </p>
          )}

          {!canUpdate && (
            <p className="text-sm text-gray-500 mt-3">
              No tienes permisos para modificar la tasa.
            </p>
          )}

          <button
            type="submit"
            disabled={!canUpdate || isSaving}
            className={`mt-6 px-6 py-2 rounded text-white ${
              canUpdate && !isSaving
                ? 'bg-lime-500 hover:bg-lime-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  );
}
