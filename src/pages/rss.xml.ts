/**
 * RSS 2.0 Feed
 * 访问 /rss.xml 获取最新 30 篇文章
 *
 * 说明：Astro 静态构建时会执行本端点，产出 dist/rss.xml。
 *       BaseLayout.astro 中通过 <link rel="alternate"> 引用本文件。
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE, ARTICLE_CATEGORIES, articleUrl } from '../consts';

export async function GET(context: { site?: URL }) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const sorted = articles.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    trailingSlash: false,
    customData: [
      `<language>zh-cn</language>`,
      `<copyright>© ${new Date().getFullYear()} ${SITE.name}</copyright>`,
      `<managingEditor>${SITE.email} (${SITE.author})</managingEditor>`,
      `<webMaster>${SITE.email} (${SITE.author})</webMaster>`,
      `<atom:link href="${new URL('/rss.xml', context.site ?? SITE.url)}" rel="self" type="application/rss+xml" />`,
    ].join(''),
    items: sorted.slice(0, 30).map((article) => {
      const url = articleUrl(article);
      const categoryLabel =
        ARTICLE_CATEGORIES.find((c) => c.slug === article.data.category)?.label ??
        article.data.category;

      return {
        title: article.data.title,
        description: article.data.excerpt ?? article.data.description,
        pubDate: article.data.pubDate,
        link: url,
        categories: [categoryLabel, ...(article.data.tags ?? [])],
        author: `${SITE.email} (${article.data.author})`,
        customData: [
          article.data.updatedDate
            ? `<atom:updated>${article.data.updatedDate.toISOString()}</atom:updated>`
            : '',
          `<source url="${new URL('/rss.xml', context.site ?? SITE.url)}">${SITE.name}</source>`,
        ].join(''),
      };
    }),
  });
}
