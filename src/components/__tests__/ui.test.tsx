// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Badge, Confirm, EmptyState, KPICard, Pagination } from '../ui';

describe('UI Primitives', () => {
  describe('Badge', () => {
    it('renders the variant text correctly', () => {
      render(<Badge variant="In Stock" />);
      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    it('renders a custom label if provided', () => {
      render(<Badge variant="Admin" label="Super Administrator" />);
      expect(screen.getByText('Super Administrator')).toBeInTheDocument();
    });
  });

  describe('KPICard', () => {
    it('renders label, value, and subtitle', () => {
      render(
        <KPICard
          label="Total Products"
          value="1,420"
          sub="+12% from last week"
          variant="success"
        />
      );
      expect(screen.getByText(/Total Products/i)).toBeInTheDocument();
      expect(screen.getByText('1,420')).toBeInTheDocument();
      expect(screen.getByText('+12% from last week')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description, and triggers action callback', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Products Found"
          description="Try creating a new product catalog item."
          action={{ label: 'Add Product', onClick: handleAction }}
        />
      );

      expect(screen.getByText('No Products Found')).toBeInTheDocument();
      expect(
        screen.getByText('Try creating a new product catalog item.')
      ).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Add Product/i });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confirm Modal', () => {
    it('renders modal with confirm and cancel buttons', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <Confirm
          title="Archive Product"
          message="Are you sure you want to archive this product?"
          confirmLabel="Archive"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Archive Product')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to archive this product?')
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Archive/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    it('renders pagination details and triggers page navigation', () => {
      const onPage = vi.fn();
      render(
        <Pagination
          page={1}
          totalPages={3}
          total={30}
          pageSize={10}
          onPage={onPage}
        />
      );

      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();

      const nextBtn = screen.getByRole('button', { name: '2' });
      fireEvent.click(nextBtn);
      expect(onPage).toHaveBeenCalledWith(2);
    });

    it('renders null when totalPages <= 1', () => {
      const { container } = render(
        <Pagination
          page={1}
          totalPages={1}
          total={5}
          pageSize={10}
          onPage={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
