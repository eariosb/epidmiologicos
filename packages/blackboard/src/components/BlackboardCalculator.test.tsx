import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlackboardCalculator } from './BlackboardCalculator';

const typeAndEval = (value: string) => {
  const input = screen.getByLabelText('Expresión');
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('BlackboardCalculator', () => {
  it('renders and evaluates a basic expression', () => {
    render(<BlackboardCalculator />);
    typeAndEval('2+3*4');
    expect(screen.getByTestId('calc-result')).toHaveTextContent('14');
  });

  it('evaluates ncr and factorial correctly', () => {
    render(<BlackboardCalculator />);
    typeAndEval('ncr(20,5)');
    expect(screen.getByTestId('calc-result')).toHaveTextContent('15504');
    typeAndEval('5!');
    expect(screen.getByTestId('calc-result')).toHaveTextContent('120');
  });

  it('handles unicode operators from the keypad', () => {
    render(<BlackboardCalculator />);
    typeAndEval('2×3−1');
    expect(screen.getByTestId('calc-result')).toHaveTextContent('5');
    typeAndEval('10÷4');
    expect(screen.getByTestId('calc-result')).toHaveTextContent('2.5');
  });

  it('clicks keypad buttons without crashing', () => {
    render(<BlackboardCalculator />);
    for (const label of ['√', 'x²', 'nCr', '7', '×', '(', ')']) {
      fireEvent.click(screen.getByText(label));
    }
    const input = screen.getByLabelText('Expresión') as HTMLInputElement;
    expect(input.value.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('='));
  });

  it('handles division by zero and NaN as a domain error', () => {
    render(<BlackboardCalculator />);
    typeAndEval('1/0');
    expect(screen.getByTestId('calc-result')).toHaveTextContent(/dominio/i);
    typeAndEval('0/0');
    expect(screen.getByTestId('calc-result')).toHaveTextContent(/dominio/i);
  });

  it('reports parse errors without crashing', () => {
    render(<BlackboardCalculator />);
    typeAndEval('2+');
    expect(screen.getByTestId('calc-result')).toHaveTextContent(/número|Expresión/i);
    typeAndEval('foo(1)');
    expect(screen.getByTestId('calc-result')).toHaveTextContent(/desconocida/i);
  });

  it('copy button does not throw when clipboard is unavailable', () => {
    render(<BlackboardCalculator />);
    typeAndEval('2+2');
    const copyBtn = screen.getByTitle('Copiar resultado');
    expect(() => fireEvent.click(copyBtn)).not.toThrow();
  });
});
