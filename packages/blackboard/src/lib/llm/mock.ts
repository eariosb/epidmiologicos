import type { LLMProvider, LLMMessage, LLMChatOptions } from '../../types/blackboard';

const CONTRACT_RESPONSE = `**Respuesta breve**
Una tabla 2x2 resume la asociación entre una exposición binaria y un desenlace binario: de ella se estiman el RR, el OR y la RD según el diseño que la produjo.

**Definición / Formulación**
Con la convención del curso (filas = exposición, columnas = desenlace): $a$ = expuestos con evento, $b$ = expuestos sin evento, $c$ = no expuestos con evento, $d$ = no expuestos sin evento.
$$RR = \\frac{a/(a+b)}{c/(c+d)}, \\qquad OR = \\frac{ad}{bc}, \\qquad RD = \\frac{a}{a+b} - \\frac{c}{c+d}$$

**Ejemplo en R**
\`\`\`r
# tabaquismo materno y bajo peso al nacer (modulo 5)
# convencion: matrix() llena por columnas -> byrow = TRUE
tab <- matrix(c(30, 70, 20, 180), ncol = 2, byrow = TRUE,
              dimnames = list(fuma = c("si", "no"), bpeso = c("si", "no")))
a <- tab[1,1]; b <- tab[1,2]; cc <- tab[2,1]; d <- tab[2,2]
c(RR = (a/(a+b))/(cc/(cc+d)),
  OR = a*d/(b*cc),
  RD = a/(a+b) - cc/(cc+d))
# -> RR = 3.00, OR = 3.86, RD = 0.20: estimador -> IC -> p, en ese orden
\`\`\`

**Interpretación**
RR compara riesgos entre expuestos y no expuestos (legible en cohortes); OR es el estimando universal del diseño de casos y controles; RD es la escala de salud pública (casos atribuibles por persona expuesta).

**Referencias**
[sin fuentes del corpus en este turno — respuesta de conocimiento general]`;

const PLOT_RESPONSE = `**Ejemplo en R**
\`\`\`r
# curva epidemica de un brote: casos incidentes por semana
semana <- 1:12
casos <- c(2, 5, 14, 30, 58, 90, 120, 105, 70, 38, 16, 6)
barplot(casos, names.arg = semana, col = "#2166ac",
        xlab = "Semana del brote", ylab = "Casos incidentes",
        main = "Curva epidemica (histograma de casos por semana)")
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
