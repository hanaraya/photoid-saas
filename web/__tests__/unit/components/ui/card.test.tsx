/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Component', () => {
  it('should render basic card', () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
    const card = screen.getByText('Card content').closest('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it('should render card with header', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should render card with footer', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should support custom className', () => {
    render(
      <Card className="custom-card">
        <CardContent>Custom content</CardContent>
      </Card>
    );

    const card = screen
      .getByText('Custom content')
      .closest('[data-slot="card"]');
    expect(card).toHaveClass('custom-card');
  });

  it('should handle complex content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complex Card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="content-section">
            <p>Paragraph content</p>
            <button>Action Button</button>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Complex Card')).toBeInTheDocument();
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /action button/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should work without header or footer', () => {
    render(
      <Card>
        <CardContent>Just content</CardContent>
      </Card>
    );

    expect(screen.getByText('Just content')).toBeInTheDocument();
  });

  it('should render card title with correct data-slot', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Semantic Card</CardTitle>
        </CardHeader>
        <CardContent>This card should have proper structure</CardContent>
      </Card>
    );

    const title = screen.getByText('Semantic Card');
    expect(title).toHaveAttribute('data-slot', 'card-title');
  });

  it('should render card description with correct data-slot', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
      </Card>
    );

    const description = screen.getByText('Description text');
    expect(description).toHaveAttribute('data-slot', 'card-description');
  });

  it('should handle nested cards', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Outer Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Card>
            <CardContent>Inner Card</CardContent>
          </Card>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Outer Card')).toBeInTheDocument();
    expect(screen.getByText('Inner Card')).toBeInTheDocument();
  });

  it('should support interactive content', () => {
    const handleClick = jest.fn();

    render(
      <Card onClick={handleClick}>
        <CardContent>Clickable card</CardContent>
      </Card>
    );

    const card = screen
      .getByText('Clickable card')
      .closest('[data-slot="card"]') as HTMLElement | null;
    card?.click();

    expect(handleClick).toHaveBeenCalled();
  });

  it('should have proper styling classes', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Styled Card</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
  });

  it('should render card header with correct data-slot', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Header Test</CardTitle>
        </CardHeader>
      </Card>
    );

    const header = screen
      .getByText('Header Test')
      .closest('[data-slot="card-header"]');
    expect(header).toBeInTheDocument();
  });

  it('should render card content with correct data-slot', () => {
    render(
      <Card>
        <CardContent>Content Test</CardContent>
      </Card>
    );

    const content = screen.getByText('Content Test');
    expect(content.closest('[data-slot="card-content"]')).toBeInTheDocument();
  });

  it('should render card footer with correct data-slot', () => {
    render(
      <Card>
        <CardFooter>Footer Test</CardFooter>
      </Card>
    );

    const footer = screen.getByText('Footer Test');
    expect(footer.closest('[data-slot="card-footer"]')).toBeInTheDocument();
  });
});
