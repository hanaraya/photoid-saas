/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { BreadcrumbSchema, BREADCRUMBS } from '@/components/breadcrumb-schema';

describe('BreadcrumbSchema', () => {
  it('should render breadcrumb schema with single item', () => {
    const items = [{ name: 'Home', url: 'https://safepassportpic.com' }];
    const { container } = render(<BreadcrumbSchema items={items} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(1);
    expect(jsonLd.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://safepassportpic.com',
    });
  });

  it('should render breadcrumb schema with multiple items', () => {
    const items = [
      { name: 'Home', url: 'https://safepassportpic.com' },
      { name: 'Blog', url: 'https://safepassportpic.com/blog' },
      { name: 'Article', url: 'https://safepassportpic.com/blog/article' },
    ];
    const { container } = render(<BreadcrumbSchema items={items} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script?.textContent || '{}');

    expect(jsonLd.itemListElement).toHaveLength(3);
    expect(jsonLd.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://safepassportpic.com/blog',
    });
    expect(jsonLd.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Article',
      item: 'https://safepassportpic.com/blog/article',
    });
  });

  it('should have BREADCRUMBS.home config', () => {
    expect(BREADCRUMBS.home).toHaveLength(1);
    expect(BREADCRUMBS.home[0].name).toBe('Home');
  });

  it('should have BREADCRUMBS.app config', () => {
    expect(BREADCRUMBS.app).toHaveLength(2);
    expect(BREADCRUMBS.app[1].name).toBe('Create Photo');
  });

  it('should have BREADCRUMBS.usPassport config', () => {
    expect(BREADCRUMBS.usPassport).toHaveLength(2);
    expect(BREADCRUMBS.usPassport[1].name).toBe('US Passport Photo');
  });

  it('should have BREADCRUMBS.ukPassport config', () => {
    expect(BREADCRUMBS.ukPassport).toHaveLength(2);
    expect(BREADCRUMBS.ukPassport[1].name).toBe('UK Passport Photo');
  });

  it('should have BREADCRUMBS.canadianPassport config', () => {
    expect(BREADCRUMBS.canadianPassport).toHaveLength(2);
    expect(BREADCRUMBS.canadianPassport[1].name).toBe('Canadian Passport Photo');
  });

  it('should have BREADCRUMBS.indianPassport config', () => {
    expect(BREADCRUMBS.indianPassport).toHaveLength(2);
    expect(BREADCRUMBS.indianPassport[1].name).toBe('Indian Passport Photo');
  });

  it('should have BREADCRUMBS.greenCard config', () => {
    expect(BREADCRUMBS.greenCard).toHaveLength(2);
    expect(BREADCRUMBS.greenCard[1].name).toBe('Green Card Photo');
  });

  it('should have BREADCRUMBS.blog config', () => {
    expect(BREADCRUMBS.blog).toHaveLength(2);
    expect(BREADCRUMBS.blog[1].name).toBe('Blog');
  });

  it('should have BREADCRUMBS.privacy config', () => {
    expect(BREADCRUMBS.privacy).toHaveLength(2);
    expect(BREADCRUMBS.privacy[1].name).toBe('Privacy Policy');
  });

  it('should have BREADCRUMBS.terms config', () => {
    expect(BREADCRUMBS.terms).toHaveLength(2);
    expect(BREADCRUMBS.terms[1].name).toBe('Terms of Service');
  });

  it('should have BREADCRUMBS.refund config', () => {
    expect(BREADCRUMBS.refund).toHaveLength(2);
    expect(BREADCRUMBS.refund[1].name).toBe('Refund Policy');
  });

  it('should generate blogPost breadcrumb dynamically', () => {
    const blogPostBreadcrumb = BREADCRUMBS.blogPost('Test Article', 'test-article');
    expect(blogPostBreadcrumb).toHaveLength(3);
    expect(blogPostBreadcrumb[2]).toEqual({
      name: 'Test Article',
      url: 'https://safepassportpic.com/blog/test-article',
    });
  });
});
