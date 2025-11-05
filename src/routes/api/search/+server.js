import { search } from '$lib/api';
import { json } from '@sveltejs/kit';

export async function GET({ url, locals, platform }) {
  const currentUser = locals.user;
  const searchQuery = url.searchParams.get('q') || '';

  const results = await search(platform, searchQuery, currentUser);

  return json(results);
}
