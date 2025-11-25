'use client'

// TANSTACK QUERY INTEGRATION using orpc": https://orpc.dev/docs/integrations/tanstack-query#hydration  scroll to bottom under HYdration section see nextjs example and make files in directories 


import { useState } from 'react'
import { createQueryClient } from '../lib/query/client'
import { QueryClientProvider } from '@tanstack/react-query'

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}