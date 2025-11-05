import { getAsset } from '$lib/api';
import { error } from '@sveltejs/kit';

export const GET = async ({ params, setHeaders, platform }) => {
  const path = params.path;
  // Pass platform to getAsset
  const file = await getAsset(platform, path);

  if (!file || !file.data) {
    throw error(404, 'Asset not found');
  }

  // Set response headers
  setHeaders({
    'Content-Type': file.mime_type, // note: use mime_type from db
    'Content-Length': file.size.toString(),
    'Last-Modified': new Date(file.updated_at).toUTCString(), // use updated_at from db
    'Cache-Control': 'public, max-age=600'
  });

  return new Response(file.data);
};
