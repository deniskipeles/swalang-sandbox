import { useEffect, useRef, useState } from "react";

export function useWebSocket(wsUrl?: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) return;

    // Auto-upgrade to wss:// if the page is served over HTTPS
    let secureUrl = wsUrl;
    if (wsUrl.startsWith('ws://') && window.location.protocol === 'https:') {
      secureUrl = wsUrl.replace('ws://', 'wss://');
    // } else if (wsUrl.startsWith('http://')) {
    //   secureUrl = wsUrl.replace('http://', 'wss://');
    } else if (wsUrl.startsWith('https://')) {
      secureUrl = wsUrl.replace('https://', 'wss://');
    }

    const socket = new WebSocket(secureUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected securely');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Only accept messages with a 'content' string field
        if (typeof data === 'object' && data !== null && typeof data.content === 'string') {
          setMessages((prev) => [...prev, data.content]);
        }
        // Optional: ignore or log invalid messages
      } catch (error) {
        console.warn('Invalid JSON received over WebSocket:', event.data);
        // Do not process malformed data
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // You may want to show a user-friendly error or retry logic here
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [wsUrl]);

  function runCode() {
    setMessages([]); // Clear previous messages
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: "run" }));
    } else {
      console.warn('WebSocket is not open. Cannot send "run" command.');
    }
  }

  return { messages, runCode };
}