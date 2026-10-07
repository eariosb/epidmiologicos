'use client';

import { useRef, type ReactNode } from 'react';
import { BlackboardPanel } from './BlackboardPanel';
import { BlackboardToolbar } from './BlackboardToolbar';
import { BlackboardCanvas } from './BlackboardCanvas';
import { BlackboardAssistant } from './BlackboardAssistant';
import { useBlackboardScene } from '../hooks/useBlackboardScene';
import { useBlackboardContext } from '../lib/context';
import type { BlackboardCanvasRef } from './BlackboardCanvas';

interface BlackboardProps {
  theme?: 'light' | 'dark';
  onExecuteR?: (code: string) => void;
  footer?: ReactNode;
}

export function Blackboard({ theme = 'light', onExecuteR, footer }: BlackboardProps) {
  const canvasRef = useRef<BlackboardCanvasRef>(null);
  const { state } = useBlackboardContext();
  const { activeScene, saveScene } = useBlackboardScene();

  const sceneId = activeScene?.id ?? 'default';

  return (
    <BlackboardPanel>
      <div className="flex h-full flex-col bg-white">
        <BlackboardToolbar canvasRef={canvasRef} />
        <BlackboardCanvas
          ref={canvasRef}
          sceneId={sceneId}
          initialScene={activeScene}
          onChange={saveScene}
          theme={theme}
        />
        <BlackboardAssistant onExecuteR={onExecuteR} />
        {footer}
      </div>
    </BlackboardPanel>
  );
}
