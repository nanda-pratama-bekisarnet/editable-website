import { getPage } from '$lib/api';

export async function load({ locals, platform }) {
  const currentUser = locals.user;
  const page = await getPage(platform, 'imprint');
  
  return {
    currentUser,
    page
  };
}
