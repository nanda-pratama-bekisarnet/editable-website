import { getArticles } from '$lib/api';

export async function load({ locals, platform }) {
  const currentUser = locals.user;
  const articles = await getArticles(platform, currentUser);

  return {
    currentUser,
    articles
  };
}
