'use client';

import { BlackboardTrigger } from '@cursos/blackboard';
import { useBroadcast } from '@/hooks/useBroadcast';

export function RoleAwareBlackboardTrigger() {
  const { mode } = useBroadcast();
  if (mode === 'student') return null;
  return <BlackboardTrigger />;
}
