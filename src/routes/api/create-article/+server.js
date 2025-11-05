import { json } from '@sveltejs/kit';
import { createArticle } from '$lib/api';

export async function POST({ request, locals, platform }) {
  const currentUser = locals.user;
  const { title, content, teaser } = await request.json();

  const article = await createArticle(platform, title, content, teaser, currentUser);

  if (!article) {
    return json({ error: 'Failed to create article' }, { status: 500 });
  }

  return json({ slug: article.slug });
}
