// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as appContext from '../../context';
import Sidebar from '../Sidebar';

describe('Sidebar Component & RBAC UI Visibility', () => {
  it('renders Administration section when currentUser is ADMIN', () => {
    const navigateMock = vi.fn();
    vi.spyOn(appContext, 'useApp').mockReturnValue({
      currentUser: {
        id: 'u-1',
        name: 'Admin User',
        email: 'admin@stockflow.internal',
        role: 'ADMIN',
        status: 'Active',
        createdAt: '2026-01-01',
      },
      currentPage: 'dashboard',
      navigate: navigateMock,
      logout: vi.fn(),
    } as any);

    render(<Sidebar />);

    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();

    const usersBtn = screen.getByText('User Management');
    fireEvent.click(usersBtn);
    expect(navigateMock).toHaveBeenCalledWith('users');
  });

  it('hides Administration section when currentUser is STAFF', () => {
    vi.spyOn(appContext, 'useApp').mockReturnValue({
      currentUser: {
        id: 'u-2',
        name: 'Staff User',
        email: 'staff@stockflow.internal',
        role: 'STAFF',
        status: 'Active',
        createdAt: '2026-01-01',
      },
      currentPage: 'dashboard',
      navigate: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(<Sidebar />);

    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });
});
