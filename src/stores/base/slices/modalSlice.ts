import { StateCreator } from 'zustand';
import { ModalSlice, ModalSize } from '../types';

export const createModalSlice: StateCreator<any, [], [], ModalSlice> = (
  set
) => ({
  // Estados iniciales
  isModalOpen: false,
  modalTitle: '',
  modalSize: 'md' as ModalSize,
  modalContent: null,

  // Acciones
  openModal: (content = '', options = {}) => {
    set({
      isModalOpen: true,
      modalTitle: options.title || content,
      modalSize: options.size || 'md',
      modalContent: options.content || null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      modalTitle: '',
      modalSize: 'md' as ModalSize,
      modalContent: null,
    });
  },
});
