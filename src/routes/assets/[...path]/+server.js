import { getAsset } from '$lib/api';
import { error } from '@sveltejs/kit';

const USE_PUBLIC_R2 = true; // 👈 toggle this if you want proxy mode in dev

export const GET = async ({ params, setHeaders, platform }) => {
  const asset_id = params.path;
  const R2_PUBLIC_URL = platform.env.R2_PUBLIC_URL;

  // ✅ If using public R2, redirect straight to it
  if (USE_PUBLIC_R2 && R2_PUBLIC_URL) {
    const redirectUrl = `${R2_PUBLIC_URL}/${asset_id}`;
    return Response.redirect(redirectUrl, 302);
  }

  // 🧱 Otherwise, fallback: fetch from D1 + R2 and proxy through your Worker
  const file = await getAsset(platform, asset_id);
  if (!file || !file.data) {
    throw error(404, 'Asset not found');
  }

  setHeaders({
    'Content-Type': file.mimeType,
    'Content-Length': file.size.toString(),
    'Last-Modified': new Date(file.lastModified).toUTCString(),
    'Cache-Control': 'public, max-age=600'
  });

  return new Response(file.data);
};
