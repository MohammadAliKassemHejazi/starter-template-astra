import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './index';

describe('Home', () => {
  it('renders heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
