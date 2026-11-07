import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SLABadge from '../components/common/SLABadge.jsx';

describe('SLABadge Component', () => {
  it('renders resolved SLA badge correctly when on track', () => {
    const sla = {
      deadline: new Date(Date.now() + 86400000).toISOString(),
      state: 'on_track'
    };
    const { container } = render(<SLABadge sla={sla} status="resolved" />);
    expect(container.textContent).toContain('SLA Met');
  });

  it('renders breached SLA badge correctly when overdue', () => {
    const sla = {
      deadline: new Date(Date.now() - 3600000).toISOString(),
      state: 'breached'
    };
    const { container } = render(<SLABadge sla={sla} status="in_progress" />);
    expect(container.textContent).toContain('Breached');
  });

  it('renders on-track badge for open incident within target window', () => {
    const sla = {
      targetHours: 48,
      deadline: new Date(Date.now() + 40 * 3600000).toISOString(),
      state: 'on_track'
    };
    const { container } = render(<SLABadge sla={sla} status="reported" />);
    expect(container.textContent).toContain('On Track');
  });
});

