import { getArticles, getPage } from '$lib/api';

export async function load({ locals, platform }) {
  const currentUser = locals.user;

  const articles = await getArticles(platform, currentUser);
  const page = await getPage(platform, 'home');

  return {
    currentUser,
    articles: articles.slice(0, 3),
    page
  };
}
