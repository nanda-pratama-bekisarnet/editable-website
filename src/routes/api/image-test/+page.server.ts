// src/routes/image-test/+page.server.ts
export const load = async ({ platform }) => {
	if (!platform?.env.DB) {
		console.error('D1 binding not available');
		return { images: [], uploadMessage: 'Database not connected.' };
	}

	try {
		const { results } = await platform.env.DB.prepare(
			'SELECT * FROM images ORDER BY created_at DESC'
		).all();

		// Always return an array (never undefined)
		return { images: results ?? [] };
	} catch (error) {
		console.error('Error loading images:', error);
		return { images: [], uploadMessage: 'Failed to load images.' };
	}
};
