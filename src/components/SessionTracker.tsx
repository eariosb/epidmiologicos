'use client';

import { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';

interface SessionTrackerProps {
  slug: string;
  title: string;
}

export function SessionTracker({ slug, title }: SessionTrackerProps) {
  const { visit } = useSession();

  useEffect(() => {
    visit(slug, title);
  }, [slug, title, visit]);

  return null;
}
