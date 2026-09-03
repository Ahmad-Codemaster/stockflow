import React from 'react';
import { AuthProvider } from './AuthContext';
import { InventoryProvider, useInventory } from './InventoryContext';
import { UIProvider } from './UIContext';

export * from './AuthContext';
export * from './InventoryContext';
export * from './UIContext';

function AuthWithSync({ children }: { children: React.ReactNode }) {
  const { refreshData } = useInventory();
  return <AuthProvider onLoginSuccess={refreshData}>{children}</AuthProvider>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <InventoryProvider>
        <AuthWithSync>{children}</AuthWithSync>
      </InventoryProvider>
    </UIProvider>
  );
}
