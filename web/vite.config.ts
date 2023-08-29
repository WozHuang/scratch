import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

const resolveHtml = (name: string) =>
  resolve(__dirname, `./${name}/index.html`);

// https://vitejs.dev/config/
export default defineConfig({
  base: '/web/',
  resolve: {
    alias: {
      // 为了 external 引入 jquery
      jquery: resolve(__dirname, 'jq/jq.global.ts')
    }
  },
  build: {
    outDir: 'dist/web',
    manifest: true,
    rollupOptions: {
      input: {
        jq: resolveHtml('jq'),
        server: resolve(__dirname, `./server/index.ts`)
      },
      output: {
        paths: {
          react: 'https://esm.sh/react@18.2.0',
          'react-dom': 'https://esm.sh/react-dom@18.2.0'
        }
      },
      external: ['react', 'react-dom']
    }
    //   manifest: true
  },
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: PROXY_HOST,
  //       changeOrigin: true,
  //     },
  //   },
  // },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
        // 不需要使用 cssnano，vite本身默认就有用 esbuild压缩css的功能
        // require("cssnano")({ preset: "default" }),
      ]
    }
  }
});
