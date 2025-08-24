// JSON-LD Structured Data for SEO

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Productify",
  "description": "The ultimate productivity platform for modern teams",
  "url": "https://productify.app",
  "logo": "https://productify.app/logo.png",
  "sameAs": [
    "https://twitter.com/productifyapp",
    "https://linkedin.com/company/productifyapp",
    "https://github.com/productifyapp"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service",
    "email": "support@productify.app"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Productivity St",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  }
}

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Productify",
  "description": "Comprehensive productivity and task management platform for modern teams",
  "url": "https://productify.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "29.00",
    "priceCurrency": "USD",
    "priceValidUntil": "2024-12-31",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Organization",
    "name": "Productify Inc."
  },
  "datePublished": "2024-01-01",
  "softwareVersion": "1.0.0"
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Productify",
  "description": "Ultimate productivity platform for modern teams",
  "url": "https://productify.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://productify.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Productify Inc.",
    "logo": {
      "@type": "ImageObject",
      "url": "https://productify.app/logo.png"
    }
  }
}

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Productify Task Management",
  "description": "Professional task and project management service for teams",
  "provider": {
    "@type": "Organization",
    "name": "Productify Inc."
  },
  "serviceType": "Task Management Software",
  "offers": [
    {
      "@type": "Offer",
      "name": "Starter Plan",
      "price": "9.00",
      "priceCurrency": "USD",
      "billingIncrement": "Monthly"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "29.00",
      "priceCurrency": "USD",
      "billingIncrement": "Monthly"
    },
    {
      "@type": "Offer",
      "name": "Enterprise Plan",
      "price": "Custom",
      "priceCurrency": "USD",
      "billingIncrement": "Monthly"
    }
  ]
}

export const breadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
})

export const faqSchema = (faqs: Array<{question: string, answer: string}>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
})

export const articleSchema = (article: {
  title: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
  image?: string
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "author": {
    "@type": "Person",
    "name": article.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Productify Inc.",
    "logo": {
      "@type": "ImageObject",
      "url": "https://productify.app/logo.png"
    }
  },
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "url": article.url,
  "image": article.image,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": article.url
  }
})