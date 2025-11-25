// ** IMPORTANT** THIS SERVER IS CREATED USING ORPC NEXTJS ADAPATER, CHECK OUT HERE https://orpc.unnoq.com/docs/adapters/next
// EXACT SMAE CODE JUST TAKE CARE OF ROUTER, ONLY IMPORT WHAT ROUTER YOU DEFINED USING ORPC.

import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
// **IMPORTANT** IMPORT ROUTER FROM APP OR THE ROUTER WE CREATED USING ORPC IN APP FOLDER, TH NEXTJS/ROUTER IS USED FOR NAVIGATION.
import { router } from '@/app/router'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: '/rpc',
    context: {}, // Provide initial context if needed
  })

  return response ?? new Response('Not found', { status: 404 })
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest