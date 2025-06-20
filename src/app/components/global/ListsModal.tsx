import { Product } from '@/interfaces/product.interface';
import { HeartIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import HR from '../global/HR';
import { useState } from 'react';

interface List {
  id: string;
  name: string;
}

interface ListsModalProps {
  lists: List[];
  product: Product;
  onAddToList: (listId: string) => Promise<void>;
  onCreateNewList: (newListName: string) => Promise<void>;
  onCancel: () => void;
  onSave: () => void;
}

const ListsModal = ({
  lists,
  product,
  onAddToList,
  onCancel,
  onCreateNewList,
  onSave,
}: ListsModalProps) => {
  const [currentView, setCurrentView] = useState<'lists' | 'createList'>(
    'lists'
  );
  const [newListName, setNewListName] = useState('');  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    new Set()
  );
  
  // Estados de carga internos del modal
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);

  const handleListToggle = (listId: string) => {
    setSelectedListIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(listId)) {
        newSelected.delete(listId);
      } else {
        newSelected.add(listId);
      }
      return newSelected;
    });
  };
  const handleSaveSelections = async () => {
    setIsAddingToList(true);
    try {
      // Agregar el producto a todas las listas seleccionadas
      for (const listId of selectedListIds) {
        await onAddToList(listId);
      }
      onSave();
    } finally {
      setIsAddingToList(false);
    }
  };

  const handleCreateNewList = async () => {
    if (newListName.trim() === '') {
      alert('Por favor, ingresa un nombre para la nueva lista.');
      return;
    }
    setIsCreatingList(true);
    try {
      await onCreateNewList(newListName);
      setNewListName('');
      setCurrentView('lists');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleBackToLists = () => {
    setCurrentView('lists');
    setNewListName('');
  };

  const createListView = (
    <div className="space-y-4">
      <h5 className="font-semibold text-2xl">Crear nueva lista</h5>
      <p className="text-slate-500 w-full">Nombre de la lista</p>{' '}
      <input
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        type="text"
        className="border border-slate-300 rounded px-4 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Ingresa el nombre de la lista"
        disabled={isCreatingList}
      />
      <div className="flex items-center justify-between">
        {' '}
        <button
          className="bg-lime-500 text-white hover:bg-lime-600 transition-colors ease-in-out duration-300 px-12 py-3 cursor-pointer rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreateNewList}
          disabled={isCreatingList}        >
          {isCreatingList ? (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="animate-spin w-4 h-4" />
            </div>
          ) : (
            'Crear'
          )}
        </button>
        <button>
          <span
            className="bg-slate-500 text-white hover:bg-slate-600 transition-colors ease-in-out duration-300 px-12 py-3 border-[1px] cursor-pointer rounded"
            onClick={handleBackToLists}
          >
            Cancelar
          </span>
        </button>
      </div>
    </div>
  );

  const listsView = (
    <div className="space-y-4">
      <div className="flex gap-4">
        <HeartIcon width={32} height={32} />
        <div className="flex flex-col">
          <h5 className="font-semibold">Guardar</h5>
          {product.name}
        </div>
      </div>
      <p className="text-slate-500 w-full">
        Selecciona la lista en la que deseas agregar el producto.
      </p>
      <HR />
      <h5 className="font-semibold">Mis listas</h5>
      <ul className="flex flex-col space-y-2 max-h-[30dvh] overflow-y-auto">
        {lists.length > 0 ? (
          lists.map((list) => (
            <label
              htmlFor={`product-${list.id}`}
              className="cursor-pointer hover:bg-slate-100 ease-in-out duration-300 transition-colors"
              key={list.id}
            >
              <li className="flex items-center px-2 py-4 gap-4 ">
                {' '}
                <input
                  id={`product-${list.id}`}
                  type="checkbox"
                  checked={selectedListIds.has(list.id)}
                  onChange={() => handleListToggle(list.id)}
                  disabled={isAddingToList}
                />
                <span>{list.name}</span>
              </li>
              <HR />
            </label>
          ))
        ) : (
          <li className="text-slate-500">No tienes listas creadas.</li>
        )}
      </ul>

      <div className="flex items-center justify-between">
        <button
          className="text-lime-500 hover:text-lime-600 mt-4 underline transition-colors duration-300"
          onClick={() => setCurrentView('createList')}
        >
          + Crear nueva lista
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="bg-slate-500 text-white hover:bg-slate-600 transition-colors ease-in-out duration-300 px-12 py-3 border-[1px] cursor-pointer rounded"
          onClick={onCancel}
        >
          Cancelar
        </button>{' '}
        <button
          className="bg-lime-500 text-white hover:bg-lime-600 transition-colors ease-in-out duration-300 px-12 py-3 cursor-pointer rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveSelections}
          disabled={selectedListIds.size === 0 || isAddingToList}        >
          {isAddingToList ? (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="animate-spin w-4 h-4" />
            </div>
          ) : (
            'Guardar'
          )}
        </button>
      </div>
    </div>
  );

  return <>{currentView === 'lists' ? listsView : createListView}</>;
};

export default ListsModal;
