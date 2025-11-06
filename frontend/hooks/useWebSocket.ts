import { useEffect, useRef, useState } from "react";

export function useWebSocket(wsUrl?: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) return;
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      // Check for the 'content' property ---
      if (data.content) {
        setMessages(prev => [...prev, data.content]);
      }
    };
    return () => ws.current?.close();
  }, [wsUrl]);

  function runCode() {
    setMessages([]); // This correctly clears the console before a new run
    ws.current?.send(JSON.stringify({ action: "run" }));
  }

  return { messages, runCode };
}