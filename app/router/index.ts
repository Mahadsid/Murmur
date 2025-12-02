//https://orpc.unnoq.com/docs/getting-started
// THIS is oRPC setup, oRPC simplifies RPC service definition, making it easy to build scalable applications, from simple scripts to complex microservices.
// This guide covers the basics: defining procedures(OR SERVER CALLS LIKE WE DID IN LEARNOVA), handling errors, and integrating with popular frameworks.


import { createChannel, listChannels } from "./channel";
import { createMessage } from "./message";
import { createWorkspace, listWorkspaces } from "./workspace";



//Make a standard function with name router, 
export const router = {
  //first route, for our workspace and in this we can declare/define our procedures (like getItems, getWorkspaces, createWorkspaces etc) so we create an new file workspace.ts and define functionality over there. 
 //workspace routes
  workspace: {
    list: listWorkspaces,
    create: createWorkspace,
  },
  //channel routes
  channel: {
    create: createChannel,
    list: listChannels,
  },
  //message routes
  message: {
    create: createMessage,
  },
}