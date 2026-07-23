# SDKs

## TypeScript SDK (`@clipforge/sdk`)

A typed REST client used by the web app and available to integrators.

```ts
import { ClipForgeClient } from '@clipforge/sdk';

const client = new ClipForgeClient({
  baseUrl: 'http://localhost:4000',
  apiVersion: 'v1',
  getToken: async () => myAuthToken,
});

const projects = await client.projects.list();
const { videoId, uploadUrl } = await client.videos.createUploadUrl({
  projectId, filename: 'talk.mp4', contentType: 'video/mp4',
});
// PUT the file to uploadUrl, then:
const { jobId } = await client.videos.process(videoId, { generateSeries: true });
const clips = await client.clips.listForVideo(videoId);
await client.clips.updateReasoning(clips[0].id, 'My edited explanation');
```

### Regeneration

Types are kept in sync with the API's OpenAPI document:

```bash
pnpm sdk:generate
# openapi-typescript http://localhost:4000/api/docs-json -o src/openapi.d.ts
```

The hand-authored `ClipForgeClient` core stays stable; only the generated types change.

## Python SDK

For server-to-server use, the AI service is called via the documented `PipelineRunRequest`
contract (`services/ai`). A thin Python client mirroring `ClipForgeClient` can be generated
from the same OpenAPI document with `openapi-python-client`.
