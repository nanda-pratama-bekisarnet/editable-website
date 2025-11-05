import { getPlatform } from '$lib/platform';
import { getCurrentUser } from '$lib/api';

export async function handle({ event, resolve }) {
  const platform = getPlatform(event);
  event.locals.user = await getCurrentUser(platform, event.cookies.get('sessionid'));
  return resolve(event);
}
