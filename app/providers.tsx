'use client';

import { SettingsProvider } from '@/hooks/useSettings';
import { SessionProvider } from 'next-auth/react';
 
type Props = {
  children?: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider> 
        <SettingsProvider>
           {children}
        </SettingsProvider>
      
    </SessionProvider>
  );
};
