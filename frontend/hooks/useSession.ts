import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<{ session_id: string, ws_url: string } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/session/new`, {
      method: "POST",
    })
      .then(res => {
        if (!res.ok) {
          console.error("Failed to create session:", res.status, res.statusText);
          res.text().then(text => console.error("Response body:", text));
          return null;
        }
        return res.json()
      })
      .then(data => {
        if (data) {
          console.log("Session data:", data);
          setSession({
            ...data,
            ws_url: `${process.env.NEXT_PUBLIC_WS_BASE}${data.ws_url}`
          })
        }
      });
  }, []);

  return session;
}
