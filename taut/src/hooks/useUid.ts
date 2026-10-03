import { useEffect, useState } from "react";
import { currentUid, requireUid } from "../firebase";

/** Anonymous auth uid of this device, resolved once `authReady` settles. */
export function useUid(): string | null {
  const [uid, setUid] = useState<string | null>(() => currentUid());

  useEffect(() => {
    let active = true;
    requireUid()
      .then((resolved) => {
        if (active) setUid(resolved);
      })
      .catch(() => {
        if (active) setUid(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return uid;
}
