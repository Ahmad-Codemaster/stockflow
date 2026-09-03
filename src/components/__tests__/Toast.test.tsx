// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as appContext from '../../context';
import ToastContainer from '../Toast';

describe('ToastContainer', () => {
  it('renders active toasts and handles dismissal', () => {
    const dismissToastMock = vi.fn();
    vi.spyOn(appContext, 'useApp').mockReturnValue({
      toasts: [
        { id: 't-1', type: 'success', message: 'Product created successfully' },
        { id: 't-2', type: 'error', message: 'Network request failed' },
      ],
      dismissToast: dismissToastMock,
    } as any);

    render(<ToastContainer />);

    expect(
      screen.getByText('Product created successfully')
    ).toBeInTheDocument();
    expect(screen.getByText('Network request failed')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBe(2);

    fireEvent.click(closeButtons[0]);
    expect(dismissToastMock).toHaveBeenCalledWith('t-1');
  });

  it('renders nothing when toasts array is empty', () => {
    vi.spyOn(appContext, 'useApp').mockReturnValue({
      toasts: [],
      dismissToast: vi.fn(),
    } as any);

    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });
});
