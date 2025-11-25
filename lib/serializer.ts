// TANSTACK QUERY INTEGRATION using orpc": https://orpc.dev/docs/integrations/tanstack-query#hydration  scroll to bottom under HYdration section see nextjs example and make files in directories 

import { StandardRPCJsonSerializer } from '@orpc/client/standard'

export const serializer = new StandardRPCJsonSerializer({
  customJsonSerializers: [
    // put custom serializers here
  ]
})
