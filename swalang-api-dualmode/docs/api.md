# Swalang API Documentation for Frontend Developers

This guide provides everything you need to integrate your frontend application with the Swalang Cloud Sandbox API. We'll cover the API's lifecycle, endpoints, and provide practical examples for popular frameworks like Next.js and SvelteKit.

## 🚀 API Lifecycle

Integrating with the Swalang API follows a simple lifecycle:

1.  **Create a Session:** Request a new session from the backend. This gives you a unique `session_id` and a dedicated sandbox environment on the server.
2.  **Upload Files:** Use the `session_id` to upload the user's code to the sandbox. You can upload multiple files to support multi-file projects.
3.  **Execute the Code:** Choose one of the two execution modes:
    *   **JSON Mode:** A simple HTTP POST request that returns the full `stdout` and `stderr` after the code has finished running.
    *   **Realtime Mode:** A WebSocket connection that streams `stdout` and `stderr` to the client in real-time as the code executes.
4.  **(Optional) Retrieve Logs:** After an execution in JSON mode, you can fetch the logs of that run.

---

## 🌐 Endpoints

Let's dive into the details of each endpoint.

### 1. `POST /api/session/new`

Creates a new session and returns a session ID and a WebSocket URL.

**Response Body:**

```json
{
  "session_id": "a1b2c3d4-e5f6-...",
  "ws_url": "wss://your-api-domain.com/api/session/a1b2c3d4-e5f6-.../ws"
}
```

---

### 2. `POST /api/session/:id/files`

Uploads a file to the specified session's sandbox.

**Request Body:**

```json
{
  "path": "main.sw",
  "content": "your swalang code here"
}
```

-   `path`: The relative path of the file within the sandbox. You can include directories (e.g., `src/helpers/utils.sw`).
-   `content`: The code to be written to the file.

---

### 3. `POST /api/session/:id/run` (JSON Mode)

Executes the code in the session's sandbox and returns the output. This is a synchronous request, meaning it will only respond after the execution is complete.

**Response Body:**

```json
{
  "Stdout": "Hello, Swalang!\n",
  "Stderr": ""
}
```

---

### 4. `GET /api/session/:id/logs`

Retrieves the logs from the most recent JSON mode execution for a session.

**Response Body:**

A plain text response containing the `stdout` and `stderr` from the run.

```
--- STDOUT ---
Hello, Swalang!

--- STDERR ---
```

---

### 5. `WS /api/session/:id/ws` (Realtime Mode)

Establishes a WebSocket connection for real-time execution and output streaming.

**Sending Messages:**

To start the execution, send a JSON message to the WebSocket server:

```json
{
  "action": "run"
}
```

**Receiving Messages:**

The server will stream messages back to the client. Each message is a JSON object with a `type` and `content`.

-   `type`: Can be `"stdout"`, `"stderr"`, or `"error"`.
-   `content`: The line of output or the error message.

**Example Messages:**

```json
{"type": "stdout", "content": "Starting process..."}
{"type": "stderr", "content": "Warning: something is off"}
{"type": "error", "content": "Execution timed out"}
```

---

## 💻 Frontend Integration Examples

Here are some examples of how to use the API with Next.js and SvelteKit.

### Next.js (React)

This example demonstrates a basic component that can create a session, upload a file, and run it in JSON mode.

```jsx
// components/SwalangRunner.jsx
import { useState } from 'react';

export default function SwalangRunner() {
  const [sessionId, setSessionId] = useState(null);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const code = 'print("Hello from Next.js!")'; // Or get from a code editor

  const handleRun = async () => {
    setOutput('');
    setError('');

    try {
      // 1. Create a new session
      const sessionRes = await fetch('/api/session/new', { method: 'POST' });
      const { session_id } = await sessionRes.json();
      setSessionId(session_id);

      // 2. Upload the file
      await fetch(`/api/session/${session_id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'main.sw', content: code }),
      });

      // 3. Run the code
      const runRes = await fetch(`/api/session/${session_id}/run`, { method: 'POST' });
      const { Stdout, Stderr } = await runRes.json();

      setOutput(Stdout);
      if (Stderr) {
        setError(Stderr);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div>
      <button onClick={handleRun}>Run Swalang Code</button>
      <h3>Output:</h3>
      <pre>{output}</pre>
      {error && (
        <>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </>
      )}
    </div>
  );
}
```

### SvelteKit

Here’s a similar example for a SvelteKit component that uses the WebSocket for real-time streaming.

```svelte
<!-- src/routes/SwalangRunner.svelte -->
<script>
  import { onMount } from 'svelte';

  let sessionId = null;
  let ws = null;
  let output = [];
  const code = 'print("Hello from SvelteKit!")\nprint("This is real-time!")';

  onMount(() => {
    // Clean up WebSocket on component destruction
    return () => {
      if (ws) {
        ws.close();
      }
    };
  });

  async function createSessionAndConnect() {
    const sessionRes = await fetch('/api/session/new', { method: 'POST' });
    const { session_id, ws_url } = await sessionRes.json();
    sessionId = session_id;

    // Connect to the WebSocket
    ws = new WebSocket(ws_url);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      output = [...output, message];
    };
  }

  async function handleRun() {
    if (!ws) {
      await createSessionAndConnect();
    }

    output = [];

    // Upload the file
    await fetch(`/api/session/${sessionId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'main.sw', content: code }),
    });

    // Send the run command
    ws.send(JSON.stringify({ action: 'run' }));
  }
</script>

<button on:click={handleRun}>Run Swalang Code (Real-time)</button>

<h3>Output:</h3>
<pre>
  {#each output as line}
    <span class={line.type === 'stderr' ? 'error' : ''}>{line.content}</span>
  {/each}
</pre>

<style>
  .error {
    color: red;
  }
</style>
```
