'use client'

import { useEffect, useState } from 'react';
import Whiteboard from '@/components/Whiteboard'

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="w-full h-full">
      {isClient && <Whiteboard />}
    </main>
  );
}
