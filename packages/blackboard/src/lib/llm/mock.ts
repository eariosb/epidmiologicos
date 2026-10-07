import type { LLMProvider, LLMMessage, LLMChatOptions } from '../../types/blackboard';

const CONTRACT_RESPONSE = `**Respuesta breve**
Un proceso estocástico es una familia de variables aleatorias $\\{X_t\\}_{t \\in T}$ indexadas por el tiempo: la evolución del azar, no una distribución aislada.

**Definición / Formulación**
$$\\{X_t : t \\in T\\}, \\quad X_t : \\Omega \\to E$$
donde $E$ es el espacio de estados. Una trayectoria es una realización $t \\mapsto X_t(\\omega)$ para un $\\omega$ fijo.

**Ejemplo en R**
\`\`\`r
set.seed(42)
# caminata aleatoria simple: el proceso discreto más célebre
n <- 200
pasos <- sample(c(-1, 1), n, replace = TRUE, prob = c(0.5, 0.5))
plot(cumsum(pasos), type = "l", col = "#5b21b6",
     xlab = "t", ylab = expression(S[t]), main = "Caminata aleatoria simple")
\`\`\`

**Interpretación**
Cada corrida produce una trayectoria distinta: el objeto de estudio es la ley del proceso completo (distribuciones finito-dimensionales), no un valor puntual.

**Referencias**
[sin fuentes del corpus en este turno — respuesta de conocimiento general]`;

const PLOT_RESPONSE = `**Ejemplo en R**
\`\`\`r
set.seed(42)
n <- 200
# movimiento browniano por escalado de una caminata aleatoria
dt <- 1 / n
cam <- cumsum(rnorm(n))
B <- c(0, cam * sqrt(dt))
plot(0:n, B, type = "l", col = "#5b21b6",
     xlab = "t", ylab = expression(B[t]), main = "Movimiento browniano simulado")
abline(h = 0, col = "grey60", lty = 2)
\`\`\`

**Referencias**
[sin fuentes del corpus en este turno — respuesta de conocimiento general]`;

export class MockProvider implements LLMProvider {
  id = 'none' as const;

  private pick(messages: LLMMessage[]): string {
    const lastUser = messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';
    if (/graficar|plot/i.test(lastUser)) return PLOT_RESPONSE;
    return CONTRACT_RESPONSE;
  }

  async *chat(messages: LLMMessage[], options: LLMChatOptions): AsyncIterable<string> {
    for (const chunk of this.pick(messages).match(/[\s\S]{1,40}/g) ?? []) {
      if (options.signal?.aborted) break;
      yield chunk;
    }
  }

  chatOnce(
    messages: LLMMessage[],
    _options: LLMChatOptions & { tools?: unknown[] },
  ): Promise<{ content: string; toolCalls: { id: string; name: string; arguments: string }[] }> {
    return Promise.resolve({ content: this.pick(messages), toolCalls: [] });
  }

  listModels(): Promise<string[]> {
    return Promise.resolve(['mock-model']);
  }

  supportsVision(): boolean {
    return true;
  }

  dispose(): void {
    // no resources to release
  }
}
