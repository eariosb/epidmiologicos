# @cursos/blackboard

Pizarra plegable integrada para cursos interactivos. Proporciona un panel lateral (con modo pantalla completa) donde el docente puede dibujar sobre un canvas Excalidraw, consultar a un asistente IA con contexto del módulo y ejecutar código R vía WebR.

## Instalación

```bash
pnpm add @cursos/blackboard
```

Peer dependencies: `react`, `react-dom`, `next`, `@excalidraw/excalidraw`.

## Uso básico

```tsx
// app/layout.tsx
import { BlackboardProvider } from '@cursos/blackboard';

export default function RootLayout({ children }) {
  return (
    <WebRProvider>
      <BlackboardProvider>{children}</BlackboardProvider>
    </WebRProvider>
  );
}
```

```tsx
// components/AppLayout.tsx
import { DynamicBlackboard } from './DynamicBlackboard';
import { BlackboardTrigger } from '@cursos/blackboard';

export function AppLayout({ children }) {
  return (
    <>
      {children}
      <DynamicBlackboard />
      <BlackboardTrigger />
    </>
  );
}
```

```tsx
// app/cursos/[course]/modulos/[slug]/page.tsx
import { BlackboardContextBridge } from '@cursos/blackboard';

export default function ModulePage({ params }) {
  const moduleContext = {
    slug: meta.slug,
    title: meta.title,
    objective: objectives,
    datasets: meta.datasets ?? [],
    order: meta.order,
  };
  return (
    <AppLayout>
      <BlackboardContextBridge context={moduleContext} />
      <MDXContent source={source} />
    </AppLayout>
  );
}
```

## Componentes públicos

| Componente | Rol |
|---|---|
| `BlackboardProvider` | Contexto global (reducer + storage). |
| `BlackboardPanel` | Shell del panel (visibilidad, fullscreen, accesibilidad). |
| `BlackboardTrigger` | Botón flotante para abrir/cerrar el panel. |
| `Blackboard` | Composición por defecto (toolbar + canvas + asistente). |
| `BlackboardContextBridge` | Registra el contexto del módulo y la escena por defecto. |
| `BlackboardAnchor` | Punto de anclaje dentro del MDX para abrir una escena. |
| `BlackboardEmbed` | Vista previa inline de una escena guardada (solo lectura). |

## Contratos

- `StorageProvider` — IndexedDB por defecto, localStorage fallback, memory para tests.
- `LLMProvider` — `none` (mock), `anthropic`, `openai`, `deepseek` (OpenAI-compatible), `ollama`. Interfaz única `chat()` con streaming y `chatOnce()` con tool calls.
- `GraphProvider` — `webr` (delega en el WebR del curso).

## Notas

- Las API keys se guardan en IndexedDB local (actualmente sin cifrar; se planea AES-GCM con passphrase opcional).
- WebR requiere `COOP`/`COEP` en el curso host. En Safari, `COEP: credentialless` es opcional para la pizarra.
- El atajo por defecto es `Ctrl/Cmd + Shift + B`; se desactiva cuando el foco está en inputs.
