/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('HomePage', () => {
  it('should render main heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(<HomePage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should include call-to-action links', () => {
    render(<HomePage />);
    // There are multiple CTA links on the page - use getAllBy
    const ctaLinks = screen.getAllByRole('link', {
      name: /Create Passport Photo|get started/i,
    });
    expect(ctaLinks.length).toBeGreaterThan(0);
  });

  it('should be semantically correct', () => {
    render(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should include Hero content', () => {
    render(<HomePage />);
    // Hero should display main headline
    expect(screen.getByText(/passport photos/i)).toBeInTheDocument();
  });

  it('should have proper document structure', () => {
    render(<HomePage />);
    // The page should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should include how it works section', () => {
    render(<HomePage />);
    // Multiple occurrences of "how it works" - use getAllBy
    const howItWorksElements = screen.getAllByText(/how it works/i);
    expect(howItWorksElements.length).toBeGreaterThan(0);
  });

  it('should render privacy section', () => {
    render(<HomePage />);
    // Multiple mentions of privacy content
    const privacyElements = screen.getAllByText(/your photos never leave/i);
    expect(privacyElements.length).toBeGreaterThan(0);
  });

  it('should load without console errors', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(<HomePage />);
    // Check that no unexpected console errors (filter out React-specific warnings)
    const unexpectedErrors = consoleSpy.mock.calls.filter(
      (args) => !String(args[0]).includes('Warning:')
    );
    expect(unexpectedErrors.length).toBe(0);
    consoleSpy.mockRestore();
  });

  it('should have main content wrapper', () => {
    render(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should display pricing section', () => {
    render(<HomePage />);
    // Pricing is mentioned in Hero and PricingSection (multiple occurrences)
    const priceElements = screen.getAllByText(/\$4\.99/i);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should display country flags', () => {
    render(<HomePage />);
    // Hero shows country flags (may appear multiple times)
    const usFlags = screen.getAllByText('🇺🇸');
    const ukFlags = screen.getAllByText('🇬🇧');
    expect(usFlags.length).toBeGreaterThan(0);
    expect(ukFlags.length).toBeGreaterThan(0);
  });

  it('should link to app page', () => {
    render(<HomePage />);
    // Multiple links to app - just check at least one exists
    const appLinks = screen.getAllByRole('link', {
      name: /Create Passport Photo/i,
    });
    expect(appLinks[0]).toHaveAttribute('href', '/app');
  });

  it('should have anchor link to how it works', () => {
    render(<HomePage />);
    const howItWorksLink = screen.getByRole('link', {
      name: /see how it works/i,
    });
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
  });
});
