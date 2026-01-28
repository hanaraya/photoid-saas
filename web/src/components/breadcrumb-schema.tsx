interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Pre-built breadcrumb configs for common pages
export const BREADCRUMBS = {
  home: [
    { name: 'Home', url: 'https://safepassportpic.com' },
  ],
  app: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Create Photo', url: 'https://safepassportpic.com/app' },
  ],
  usPassport: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'US Passport Photo', url: 'https://safepassportpic.com/us-passport-photo' },
  ],
  ukPassport: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'UK Passport Photo', url: 'https://safepassportpic.com/uk-passport-photo' },
  ],
  canadianPassport: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Canadian Passport Photo', url: 'https://safepassportpic.com/canadian-passport-photo' },
  ],
  indianPassport: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Indian Passport Photo', url: 'https://safepassportpic.com/indian-passport-photo' },
  ],
  greenCard: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Green Card Photo', url: 'https://safepassportpic.com/green-card-photo' },
  ],
  blog: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Blog', url: 'https://safepassportpic.com/blog' },
  ],
  blogPost: (title: string, slug: string) => [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Blog', url: 'https://safepassportpic.com/blog' },
    { name: title, url: `https://safepassportpic.com/blog/${slug}` },
  ],
  privacy: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Privacy Policy', url: 'https://safepassportpic.com/privacy' },
  ],
  terms: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Terms of Service', url: 'https://safepassportpic.com/terms' },
  ],
  refund: [
    { name: 'Home', url: 'https://safepassportpic.com' },
    { name: 'Refund Policy', url: 'https://safepassportpic.com/refund' },
  ],
};
