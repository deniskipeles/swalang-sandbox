import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<{ id: string, ws_url: string } | null>(null);

  useEffect(() => {
    // NOTE: The backend API at https://swalang-api.onrender.com/api/session/new
    // is currently returning a 404 Not Found error.
    // This code is correct according to the API guide, but will not work
    // until the backend is fixed.
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/session/new`, {
      method: "POST",
    })
      .then(res => {
        if (!res.ok) {
          console.error("Failed to create session:", res.status, res.statusText);
          return null;
        }
        return res.json()
      })
      .then(data => {
        if (data) {
          setSession(data)
        }
      });
  }, []);

  return session;
}
