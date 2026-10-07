import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LabExercise } from '@/components/LabExercise'

vi.mock('@/components/RCell', () => ({
  RCell: ({ id, code }: { id: string; code: string }) => (
    <div data-testid="rcell" data-rcell-id={id}>
      {code}
    </div>
  ),
}))

describe('LabExercise', () => {
  it('renders the lab header and runnable RCell', () => {
    render(
      <LabExercise id="lab-04-worm" title="Diagnóstico" code={'set.seed(1)\nx <- 1'} />,
    )
    expect(screen.getByText('Laboratorio')).toBeInTheDocument()
    expect(screen.getByText('Diagnóstico')).toBeInTheDocument()
    expect(screen.getByTestId('rcell')).toHaveAttribute('data-rcell-id', 'lab-04-worm')
  })

  it('renders the statement and the analysis checklist', () => {
    render(
      <LabExercise
        id="lab-08-conteo"
        title="Sobredispersión"
        code="x <- 1"
        tasks={['Compara GAIC', 'Interpreta sigma']}
      >
        <p>Simula conteos sobredispersos.</p>
      </LabExercise>,
    )
    expect(screen.getByText('Simula conteos sobredispersos.')).toBeInTheDocument()
    expect(screen.getByText('Tu turno: analiza e interpreta')).toBeInTheDocument()
    expect(screen.getByText('Compara GAIC')).toBeInTheDocument()
    expect(screen.getByText('Interpreta sigma')).toBeInTheDocument()
  })

  it('renders collapsible hint and guide answers', () => {
    render(
      <LabExercise
        id="lab-05-suavizados"
        title="P-splines"
        code="x <- 1"
        hint="Cambia lambda"
        solution="GAIC favorece el suavizado"
      />,
    )
    expect(screen.getByText('Ver pista')).toBeInTheDocument()
    expect(screen.getByText('Ver respuestas guía')).toBeInTheDocument()
    expect(screen.getByText('Cambia lambda')).toBeInTheDocument()
    expect(screen.getByText('GAIC favorece el suavizado')).toBeInTheDocument()
  })

  it('omits optional sections when props are absent', () => {
    render(<LabExercise id="lab-01" title="Minimal" code="x <- 1" />)
    expect(screen.queryByText('Tu turno: analiza e interpreta')).not.toBeInTheDocument()
    expect(screen.queryByText('Ver pista')).not.toBeInTheDocument()
    expect(screen.queryByText('Ver respuestas guía')).not.toBeInTheDocument()
  })
})
