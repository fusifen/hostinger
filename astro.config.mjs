// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hostingerpick.com',

  // 国际化路由预留：默认语言不带前缀，后续加语言只需扩充 locales
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      changefreq: 'daily',
      priority: 0.7,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  // 代码高亮：文章内的终端命令 / 配置文件需要清晰可读
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: true,
    },
  },

  build: {
    inlineStylesheets: 'auto',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
