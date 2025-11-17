'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';

export default function SupabaseProvider({
  children
}: {
  children: React.ReactNode
}) {
  // We use useState to ensure the client is only created once.
  const [supabaseClient] = useState<SupabaseClient>(() => getSupabaseBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
    >
      {children}
    </SessionContextProvider>
  );
}