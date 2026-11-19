import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Office } from '../types';
import { getOffices, getDefaultOffice } from '../services/officeService';

const STORAGE_KEY = 'expenseflow_selected_office_id';

interface OfficeContextType {
  offices: Office[];
  selectedOfficeId: number | 'ALL';
  selectedOffice: Office | undefined;
  defaultOffice: Office | undefined;
  setSelectedOfficeId: (id: number | 'ALL') => void;
  refreshOffices: () => Promise<void>;
  isLoading: boolean;
}

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [defaultOffice, setDefaultOffice] = useState<Office | undefined>(undefined);
  const [selectedOfficeId, setSelectedOfficeIdState] = useState<number | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshOffices = useCallback(async () => {
    try {
      const all = await getOffices();
      setOffices(all);
      const def = await getDefaultOffice();
      setDefaultOffice(def);
    } catch (err) {
      console.error('Error loading offices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (saved === 'ALL') {
        setSelectedOfficeIdState('ALL');
      } else {
        const parsed = Number(saved);
        if (!isNaN(parsed)) setSelectedOfficeIdState(parsed);
      }
    }
    refreshOffices();
  }, [refreshOffices]);

  const setSelectedOfficeId = useCallback((id: number | 'ALL') => {
    setSelectedOfficeIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const selectedOffice = useMemo(() => {
    if (selectedOfficeId === 'ALL') return undefined;
    return offices.find((o) => o.id === selectedOfficeId);
  }, [offices, selectedOfficeId]);

  return (
    <OfficeContext.Provider
      value={{
        offices,
        selectedOfficeId,
        selectedOffice,
        defaultOffice,
        setSelectedOfficeId,
        refreshOffices,
        isLoading,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
};

export function useOffice(): OfficeContextType {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
}
