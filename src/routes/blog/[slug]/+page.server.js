import { getArticleBySlug, getNextArticle } from '$lib/api';

export async function load({ params, locals, platform }) {
  const currentUser = locals.user;

  // Pass platform as the first argument
  const data = await getArticleBySlug(platform, params.slug);
  const nextArticle = await getNextArticle(platform, params.slug);

  const articles = nextArticle ? [nextArticle] : [];

  return {
    ...data,
    currentUser,
    articles
  };
}
