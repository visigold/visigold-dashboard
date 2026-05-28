import { createContext, useContext, useState, ReactNode } from "react";

interface ClientContextType {
  selectedClientId: number | null;
  setSelectedClientId: (id: number | null) => void;
}

const ClientContext = createContext<ClientContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  return useContext(ClientContext);
}
