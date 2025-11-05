import { json } from '@sveltejs/kit';
import { storeAsset } from '$lib/api';

export async function PUT({ request, platform }) {
  const data = await request.formData();
  const asset_id = data.get('path');
  const file = data.get('file')?.valueOf();

  // Pass platform to storeAsset
  await storeAsset(platform, asset_id, file);

  return json({ path: asset_id });
}
