import { useEffect, useRef, useState } from "react";

export function useWebSocket(wsUrl?: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) return;
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      setMessages(prev => [...prev, data.stdout || data.stderr || data.error]);
    };
    return () => ws.current?.close();
  }, [wsUrl]);

  function runCode() {
    setMessages([]);
    ws.current?.send(JSON.stringify({ action: "run" }));
  }

  return { messages, runCode };
}
