// src/routes/image-test/+page.server.ts
export const load = async ({ platform }) => {
	if (!platform?.env.DB) {
		console.error('D1 binding not available');
		return { images: [], uploadMessage: 'Database not connected.' };
	}

	try {
		// Fetch all images from your D1 table
		const { results } = await platform.env.DB.prepare(
			'SELECT * FROM images ORDER BY created_at DESC'
		).all();

		return {
			images: results ?? []
		};
	} catch (error) {
		console.error('Error loading images:', error);
		return {
			images: [],
			uploadMessage: 'Failed to load images.'
		};
	}
};
