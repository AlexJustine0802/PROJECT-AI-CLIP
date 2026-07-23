import { ClipForgeClient } from '@clipforge/sdk';

/** Browser-side SDK client. Reads the API token minted by Auth.js from the session endpoint. */
export function createClient(getToken?: () => Promise<string | undefined>): ClipForgeClient {
  return new ClipForgeClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    apiVersion: 'v1',
    getToken,
  });
}
