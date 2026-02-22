import { useState, useEffect } from 'react';

interface SavedFilter {
  id: string;
  name: string;
  reportId: string;
  filters: Record<string, string>;
  createdAt: string;
}

const STORAGE_KEY = 'saude360_report_filters';

export function useReportFilters(reportId: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all = JSON.parse(stored);
        setSavedFilters(all.filter((f: SavedFilter) => f.reportId === reportId));
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error);
      }
    }
  }, [reportId]);

  // Salvar novo filtro
  const saveFilter = (name: string, filters: Record<string, string>) => {
    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name,
      reportId,
      filters,
      createdAt: new Date().toISOString(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : [];
    const updated = [...all, newFilter];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedFilters(prev => [...prev, newFilter]);

    return newFilter;
  };

  // Remover filtro
  const removeFilter = (filterId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored);
      const updated = all.filter((f: SavedFilter) => f.id !== filterId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    }
  };

  // Carregar filtro
  const loadFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    return filter?.filters || {};
  };

  return {
    savedFilters,
    saveFilter,
    removeFilter,
    loadFilter,
  };
}
