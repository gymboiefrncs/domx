import { create } from "zustand";

interface ModalState {
  activeModalId: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModalId: null,
  openModal: (id: string) => set({ activeModalId: id }),
  closeModal: () => set({ activeModalId: null }),
}));
