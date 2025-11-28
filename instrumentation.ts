// THIS IS OPTIMISE SSR To reduce HTTP requests and improve latency during SSR, you can utilize a Server-Side Client during SSR. Below is a quick setup, see Optimize SSR for more details.
//CHECK OUT MORE HERE https://orpc.unnoq.com/docs/adapters/next
// In implementing client side. use Optimise SSR bcz it is fist then normal client side checkout the above url, scroll and find out.
// CREATE THOSE 3 FILES AND CHECKOUT THE DIRECTORIES IN WHICH THEY WILL BE PLACED AND THE FOURTH ONE ADD IMPORT IN ROOT LAYOUT.


export async function register() {
  // Conditionally import if facing runtime compatibility issues
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import('@/lib/orpc.server')
  }
}