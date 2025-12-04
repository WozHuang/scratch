import React from 'react';
import { createRoot } from 'react-dom/client';

const htmls = import.meta.glob(['./*/*.html']);
const modules = import.meta.glob(['./*/main.{ts,tsx,js,jsx}', './*/index.{ts,tsx,js,jsx}']);

const links: { title: string; url: string }[] = ([] as { title: string; url: string }[])
  .concat(Object.keys(htmls).map((key) => ({ title: key, url: key })))
  .concat(Object.keys(modules).map((key) => ({ title: `${key}`, url: `?${key}` })));

const search = location.search.slice(1);
if (search in modules) {
  modules[search]();
} else {
  const root = document.getElementById('root') as HTMLElement;
  createRoot(root).render(
    <div>
      {links.map((link) => (
        <p key={link.url}>
          <a href={link.url}>{link.title}</a>
        </p>
      ))}
    </div>
  );
}
