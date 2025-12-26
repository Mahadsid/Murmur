// THIS IS OPTIMISE SSR To reduce HTTP requests and improve latency during SSR, you can utilize a Server-Side Client during SSR. Below is a quick setup, see Optimize SSR for more details.
//CHECK OUT MORE HERE https://orpc.unnoq.com/docs/adapters/next
// In implementing client side. use Optimise SSR bcz it is fist then normal client side checkout the above url, scroll and find out.
// CREATE THOSE 3 FILES AND CHECKOUT THE DIRECTORIES IN WHICH THEY WILL BE PLACED AND THE FOURTH ONE ADD IMPORT IN ROOT LAYOUT.
// **IMPORTANT** THIS IS FOR SERVER SIDE, OS IT ONLY RUN ON SERVER SIDE 


import 'server-only'

// import { headers } from 'next/headers'
import { createRouterClient } from '@orpc/server'


// **IMPORTANT** IMPORT ROUTER FROM APP OR THE ROUTER WE CREATED USING ORPC IN APP FOLDER, TH NEXTJS/ROUTER IS USED FOR NAVIGATION.
import { router } from '@/app/router'
import { request } from '@arcjet/next'

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    // request: await headers(), // provide headers if initial context required
    request: await request(),
  }),
})