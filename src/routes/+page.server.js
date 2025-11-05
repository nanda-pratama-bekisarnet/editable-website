import { getArticles, getPage } from '$lib/api';

export async function load({ platform, locals }) {
  const currentUser = locals.user;

  const articles = await getArticles(platform, currentUser); // ✅ pass platform
  const page = await getPage(platform, 'home');              // ✅ pass platform

  return {
    currentUser,
    articles: articles.slice(0, 3),
    page
  };
}
