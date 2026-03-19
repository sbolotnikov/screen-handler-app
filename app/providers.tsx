'use client';

import { SettingsProvider } from '@/hooks/useSettings';
import { PartyProvider } from '@/hooks/usePartySettings';
import { SessionProvider } from 'next-auth/react';
 
type Props = {
  children?: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider> 
        <SettingsProvider>
          <PartyProvider>
           {children}
          </PartyProvider>
        </SettingsProvider>
      
    </SessionProvider>
  );
};
