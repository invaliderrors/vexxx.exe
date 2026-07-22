import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardHome from './page';

describe('DashboardHome', () => {
  it('renders the shell heading', () => {
    render(<DashboardHome />);
    expect(
      screen.getByRole('heading', { name: 'VEXXX Dashboard' }),
    ).toBeDefined();
  });
});
