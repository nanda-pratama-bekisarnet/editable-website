import { json } from '@sveltejs/kit';
import { deleteArticle } from '$lib/api';

export async function POST({ request, locals, platform }) {
  const user = locals.user;
  const { slug } = await request.json();

  if (!user) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  const success = await deleteArticle(platform, slug, user);

  return json({ success });
}
