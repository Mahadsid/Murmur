// TANSTACK QUERY INTEGRATION using orpc": https://orpc.dev/docs/integrations/tanstack-query#hydration  scroll to bottom under HYdration section see nextjs example and make files in directories 

import { createQueryClient } from './client'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(createQueryClient)

export function HydrateClient(props: { children: React.ReactNode, client: QueryClient }) {
  return (
    <HydrationBoundary state={dehydrate(props.client)}>
      {props.children}
    </HydrationBoundary>
  )
}