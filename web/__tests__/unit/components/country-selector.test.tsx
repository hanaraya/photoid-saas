/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySelector } from '@/components/country-selector';

describe('CountrySelector Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with selected US standard', () => {
    render(<CountrySelector value="us" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/US Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/🇺🇸/)).toBeInTheDocument();
  });

  it('should render select trigger', () => {
    render(<CountrySelector value="us" onValueChange={mockOnValueChange} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should display UK standard when selected', () => {
    render(<CountrySelector value="uk" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/UK Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/🇬🇧/)).toBeInTheDocument();
  });

  it('should display standard description', () => {
    render(<CountrySelector value="us" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/2×2 inches/i)).toBeInTheDocument();
  });

  it('should show placeholder when no value selected', () => {
    render(<CountrySelector value="" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/Select photo standard/i)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<CountrySelector value="us" onValueChange={mockOnValueChange} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded');
  });

  it('should render EU standard correctly', () => {
    render(<CountrySelector value="eu" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/EU\/Schengen Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/35×45 mm/i)).toBeInTheDocument();
  });

  it('should render Canada standard correctly', () => {
    render(
      <CountrySelector value="canada" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/Canada Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/50×70 mm/i)).toBeInTheDocument();
  });

  it('should render India standard correctly', () => {
    render(<CountrySelector value="india" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/India Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/🇮🇳/)).toBeInTheDocument();
  });

  it('should render Australia standard correctly', () => {
    render(
      <CountrySelector value="australia" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/Australia Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/🇦🇺/)).toBeInTheDocument();
  });

  it('should render visa standards', () => {
    render(
      <CountrySelector value="us_visa" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/US Visa/i)).toBeInTheDocument();
  });

  it('should render driver license standard', () => {
    render(
      <CountrySelector value="us_drivers" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/US Driver/i)).toBeInTheDocument();
  });

  it('should render green card standard', () => {
    render(
      <CountrySelector value="green_card" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/Green Card/i)).toBeInTheDocument();
  });

  it('should display flag with standard name', () => {
    const { container } = render(
      <CountrySelector value="japan" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/Japan Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/🇯🇵/)).toBeInTheDocument();
  });

  it('should handle multiple renders correctly', () => {
    const { rerender } = render(
      <CountrySelector value="us" onValueChange={mockOnValueChange} />
    );

    expect(screen.getByText(/US Passport/i)).toBeInTheDocument();

    rerender(<CountrySelector value="uk" onValueChange={mockOnValueChange} />);

    expect(screen.getByText(/UK Passport/i)).toBeInTheDocument();
  });

  it('should render with full width style', () => {
    const { container } = render(
      <CountrySelector value="us" onValueChange={mockOnValueChange} />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('w-full');
  });

  it('should truncate long standard names', () => {
    render(<CountrySelector value="us" onValueChange={mockOnValueChange} />);

    // Check that truncate class is applied
    const triggerContent = screen.getByText(/US Passport/i);
    expect(triggerContent).toHaveClass('truncate');
  });
});
