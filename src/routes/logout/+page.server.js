import { destroySession } from '$lib/api';
import { json } from '@sveltejs/kit';

export async function POST({ cookies, platform }) {
  const sessionId = cookies.get('sessionid');
  if (sessionId) {
    await destroySession(platform, sessionId);
    cookies.delete('sessionid', { path: '/' });
  }
  return json({ success: true });
}
