import { fail } from '@sveltejs/kit';
import { destroySession } from '$lib/api';

export async function load({ cookies, platform }) {
  const sessionId = cookies.get('sessionid');
  try {
    await destroySession(platform, sessionId);

    cookies.delete('sessionid', {
      path: '/' // must match what you used in cookies.set
    });
  } catch (err) {
    console.error(err);
    return fail(400, { incorrect: true });
  }
}
