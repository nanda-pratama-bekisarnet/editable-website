import { authenticate } from '$lib/api';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies, platform }) {
  const { password } = await request.json();

  try {
    const { sessionId } = await authenticate(platform, password, 60); // session timeout 60 mins
    cookies.set('sessionid', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    return json({ success: true });
  } catch (err) {
    return json({ success: false, message: err.message }, { status: 401 });
  }
}
