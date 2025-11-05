import { redirect, fail } from '@sveltejs/kit';
import { authenticate } from '$lib/api';

export const actions = {
  default: async ({ cookies, request, platform }) => {
    const data = await request.formData();
    const password = data.get('password');
    const sessionTimeout = 60 * 24 * 7; // one week in minutes

    try {
      const { sessionId } = await authenticate(platform, password, sessionTimeout);

      cookies.set('sessionid', sessionId, {
        path: '/',                  // required
        httpOnly: true,             // prevents client JS from reading it
        maxAge: sessionTimeout * 60, // convert minutes to seconds
        sameSite: 'strict',         // optional but recommended
        secure: process.env.NODE_ENV === 'production' // only over HTTPS in prod
      });
    } catch (err) {
      console.error(err);
      return fail(400, { incorrect: true });
    }

    throw redirect(303, '/');
  }
};
