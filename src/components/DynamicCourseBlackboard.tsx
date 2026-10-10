'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useBlackboard, BlackboardSkeleton, setAssistantProfile } from '@cursos/blackboard';
import { EPI_ASSISTANT_PROFILE } from '@/config/assistant';
import type { ModuleBlock, ModuleNavItem } from './ModulesMenu';

interface DynamicCourseBlackboardProps {
  modules: ModuleNavItem[];
  blocks: readonly ModuleBlock[];
}

const CourseBlackboard = dynamic(
  () => import('./CourseBlackboard').then((mod) => mod.CourseBlackboard),
  { ssr: false, loading: () => <BlackboardSkeleton /> },
);

/**
 * Lazy-loaded blackboard panel. The heavy chunk (Excalidraw + chat UI)
 * is only downloaded the first time the professor opens the panel.
 */
export function DynamicCourseBlackboard({ modules, blocks }: DynamicCourseBlackboardProps) {
  const { state } = useBlackboard();
  // Registra el perfil del curso en cualquier página, no solo en módulos.
  useEffect(() => {
    setAssistantProfile(EPI_ASSISTANT_PROFILE);
  }, []);
  if (!state.isOpen) return null;
  return <CourseBlackboard modules={modules} blocks={blocks} />;
}
