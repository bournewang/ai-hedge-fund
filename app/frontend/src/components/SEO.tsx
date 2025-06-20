import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  url: string;
}

export function SEO({ title, description, url }: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | FREE AI INVESTMENT`;
    document.title = fullTitle;

    const ensureMeta = (selector: string, attr: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!element) {
        if (selector.startsWith('meta')) {
          element = document.createElement('meta');
          if (selector.includes('property')) {
            const property = selector.match(/property="([^"]+)"/);
            if (property) element.setAttribute('property', property[1]);
          } else if (selector.includes('name')) {
            const name = selector.match(/name="([^"]+)"/);
            if (name) element.setAttribute('name', name[1]);
          }
          document.head.appendChild(element);
        } else if (selector.startsWith('link')) {
          element = document.createElement('link');
          element.setAttribute('rel', 'canonical');
          document.head.appendChild(element);
        }
      }
      element?.setAttribute(attr, value);
    };

    ensureMeta('meta[name="description"]', 'content', description);
    ensureMeta('link[rel="canonical"]', 'href', url);
    ensureMeta('meta[property="og:title"]', 'content', fullTitle);
    ensureMeta('meta[property="og:description"]', 'content', description);
    ensureMeta('meta[property="og:url"]', 'content', url);
    ensureMeta('meta[property="og:type"]', 'content', 'website');
  }, [title, description, url]);

  return null;
}
