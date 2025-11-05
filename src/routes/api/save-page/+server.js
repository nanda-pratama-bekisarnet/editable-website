import { json } from '@sveltejs/kit';
import { createOrUpdatePage } from '$lib/api';

export async function POST({ request, locals, platform }) {
  const currentUser = locals.user;
  const { pageId, page } = await request.json();

  if (!currentUser) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  await createOrUpdatePage(platform, pageId, page, currentUser);

  return json({ pageId, status: 'ok' });
}
