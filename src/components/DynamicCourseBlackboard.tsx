'use client';

import dynamic from 'next/dynamic';
import { useBlackboard, BlackboardSkeleton } from '@cursos/blackboard';
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
  if (!state.isOpen) return null;
  return <CourseBlackboard modules={modules} blocks={blocks} />;
}
