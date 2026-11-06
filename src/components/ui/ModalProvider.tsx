import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export interface ModalEntry {
  id: number;
  title: string;
  collapsed: boolean;
  zIndex: number;
  onRestore: () => void;
  onClose: () => void;
}

interface ModalContextValue {
  register: (entry: Omit<ModalEntry, 'zIndex'>) => void;
  unregister: (id: number) => void;
  setCollapsed: (id: number, collapsed: boolean) => void;
  focus: (id: number) => void;
  entries: ModalEntry[];
}

const ModalContext = createContext<ModalContextValue | null>(null);

let nextId = 1;
let nextZ = 100;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ModalEntry[]>([]);

  const register = useCallback((entry: Omit<ModalEntry, 'zIndex'>) => {
    setEntries((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [...prev, { ...entry, zIndex: ++nextZ }];
    });
  }, []);

  const unregister = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setCollapsed = useCallback((id: number, collapsed: boolean) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, collapsed } : e)),
    );
  }, []);

  const focus = useCallback((id: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, zIndex: ++nextZ, collapsed: false } : e,
      ),
    );
  }, []);

  return (
    <ModalContext.Provider value={{ register, unregister, setCollapsed, focus, entries }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
