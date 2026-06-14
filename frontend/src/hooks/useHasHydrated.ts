import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

/**
 * Zustand persist-ийн localStorage rehydration дууссан эсэхийг буцаана.
 * false байх үед isAuthenticated нь default утга (false) тул redirect хийж болохгүй.
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState<boolean>(
    () => useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    // Хэрэв mount хийх үед аль хэдийн hydrated байвал тэр даруй true
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Эсвэл hydration дуустал хүлээнэ
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);

  return hydrated;
}
