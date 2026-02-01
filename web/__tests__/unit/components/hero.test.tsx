/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/hero';

// Mock next/link
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

describe('Hero Component', () => {
  it('should render hero content', () => {
    render(<Hero />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    render(<Hero />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.tagName).toBe('H1');
  });

  it('should include call-to-action links', () => {
    render(<Hero />);

    // Hero uses links, not buttons
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should have main CTA link to app page', () => {
    render(<Hero />);

    const appLink = screen.getByRole('link', {
      name: /Create Passport Photo/i,
    });
    expect(appLink).toHaveAttribute('href', '/app');
  });

  it('should have secondary link to how it works section', () => {
    render(<Hero />);

    const howItWorksLink = screen.getByRole('link', {
      name: /see how it works/i,
    });
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
  });

  it('should display trust badges', () => {
    render(<Hero />);

    expect(screen.getByText(/30-Day Money Back/)).toBeInTheDocument();
    expect(screen.getByText(/100% Private/)).toBeInTheDocument();
    expect(screen.getByText(/Save \$12 vs CVS/)).toBeInTheDocument();
  });

  it('should display main headline', () => {
    render(<Hero />);

    expect(screen.getByText(/Passport Photos in/)).toBeInTheDocument();
    expect(screen.getByText(/60 Seconds/)).toBeInTheDocument();
  });

  it('should display description text', () => {
    render(<Hero />);

    expect(screen.getByText(/Snap a selfie/)).toBeInTheDocument();
    expect(screen.getByText(/AI handles the rest/)).toBeInTheDocument();
  });

  it('should display pricing information', () => {
    render(<Hero />);

    // $4.99 appears multiple times (in CTA and in description)
    const priceElements = screen.getAllByText(/\$4\.99/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should display country flags', () => {
    render(<Hero />);

    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
    expect(screen.getByText('🇪🇺')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => render(<Hero />)).not.toThrow();
  });

  it('should have responsive design structure', () => {
    const { container } = render(<Hero />);

    // Check that the hero has the expected section wrapper
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});
