// THIS IS OPTIMISE SSR To reduce HTTP requests and improve latency during SSR, you can utilize a Server-Side Client during SSR. Below is a quick setup, see Optimize SSR for more details.
//CHECK OUT MORE HERE https://orpc.unnoq.com/docs/adapters/next
// In implementing client side. use Optimise SSR bcz it is fist then normal client side checkout the above url, scroll and find out.
// CREATE THOSE 3 FILES AND CHECKOUT THE DIRECTORIES IN WHICH THEY WILL BE PLACED AND THE FOURTH ONE ADD IMPORT IN ROOT LAYOUT. 

import type { RouterClient } from '@orpc/server'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient } from '@orpc/client'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

// **IMPORTANT** IMPORT ROUTER FROM APP OR THE ROUTER WE CREATED USING ORPC IN APP FOLDER, TH NEXTJS/ROUTER IS USED FOR NAVIGATION.
import { router } from '@/app/router'

declare global {
  var $client: RouterClient<typeof router> | undefined
}

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${window.location.origin}/rpc`
  },
})

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const client: RouterClient<typeof router> = globalThis.$client ?? createORPCClient(link)

// TANSTACK QUERY INTEGRATION UISNG ORPC :https://orpc.dev/docs/integrations/tanstack-query 
export const orpc = createTanstackQueryUtils(client);