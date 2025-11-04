import { getCurrentUser } from '$lib/api';

export async function handle({ event, resolve, platform }) {
  const sessionId = event.cookies.get('sessionid');
  event.locals.user = await getCurrentUser(platform, sessionId);

  return await resolve(event);
}
