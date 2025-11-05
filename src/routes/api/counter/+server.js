import { createOrUpdateCounter } from '$lib/api';
import { json } from '@sveltejs/kit';

export async function GET({ url, platform }) {
  const counterId = url.searchParams.get('c') || 'default';
  const result = await createOrUpdateCounter(platform, counterId);
  return json(result);
}
