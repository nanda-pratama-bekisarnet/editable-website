<script lang="ts">
	export let data: {
		images: { id: string; filename: string; url: string }[];
		uploadMessage?: string;
	};
</script>

<h1>Image Uploader</h1>

<!-- Post directly to the /api/image-test endpoint -->
<form method="POST" enctype="multipart/form-data" action="/api/image-test">
	<input type="file" name="imageFile" accept="image/png, image/jpeg" required />
	<button type="submit">Upload Image</button>
</form>

{#if data.uploadMessage}
	<p class="message">{data.uploadMessage}</p>
{/if}

<h2>Uploaded Images</h2>
<div class="image-grid">
	{#if data.images.length > 0}
		{#each data.images as image (image.id)}
			<div class="image-card">
				<img src={image.url} alt={image.filename} width="200" />
				<p>{image.filename}</p>
			</div>
		{/each}
	{:else}
		<p>No images uploaded yet.</p>
	{/if}
</div>

<style>
	.message {
		color: green;
		margin-top: 10px;
	}
	.image-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: 20px;
	}
	.image-card {
		border: 1px solid #ccc;
		padding: 10px;
		border-radius: 8px;
		text-align: center;
	}
	img {
		max-width: 100%;
		height: auto;
		display: block;
	}
</style>
