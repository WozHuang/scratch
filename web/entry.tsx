import React from 'react';
import { createRoot } from 'react-dom/client';

const modules: Record<string, () => void> = {
  print: () => import('./print/main'),
  xterm: () => import('./xterm/main'),
  tailwind: () => import('./tailwind/main'),
  rxjs: () => import('./rxjs/main'),
  fluent: () => import('./fluent/main'),
  rc: () => import('./rc/index'),
  collapse: () => import('./collapse/index'),
};
const links = ['jq/'].concat(Object.keys(modules).map((key) => `?${key}`));

const search = location.search.slice(1);
if (search in modules) {
  modules[search]();
} else {
  const root = document.getElementById('root') as HTMLElement;
  createRoot(root).render(
    <div>
      {links.map((link) => (
        <p key={link}>
          <a href={link}>{link}</a>
        </p>
      ))}
    </div>
  );
}
