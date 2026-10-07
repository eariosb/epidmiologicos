import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcessSteps } from '@/components/ProcessSteps'

describe('ProcessSteps', () => {
  it('renders all steps with correct numbering', () => {
    render(
      <ProcessSteps
        steps={[
          { title: 'Step A', content: 'Content A' },
          { title: 'Step B', content: 'Content B' },
          { title: 'Step C', content: 'Content C' },
        ]}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Step A')).toBeInTheDocument()
    expect(screen.getByText('Step B')).toBeInTheDocument()
    expect(screen.getByText('Step C')).toBeInTheDocument()
    expect(screen.getByText('Content A')).toBeInTheDocument()
    expect(screen.getByText('Content B')).toBeInTheDocument()
    expect(screen.getByText('Content C')).toBeInTheDocument()
  })

  it('renders an ordered list', () => {
    const { container } = render(
      <ProcessSteps steps={[{ title: 'Only step', content: 'Only content' }]} />
    )
    expect(container.querySelector('ol')).toBeInTheDocument()
  })

  it('renders empty list with no errors', () => {
    const { container } = render(<ProcessSteps steps={[]} />)
    expect(container.querySelector('ol')).toBeInTheDocument()
    expect(container.querySelectorAll('li')).toHaveLength(0)
  })
})
