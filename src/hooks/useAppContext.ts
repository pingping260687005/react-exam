import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import type { AppContextType } from '../context/types';

/**
 * Hook for accessing Context
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}