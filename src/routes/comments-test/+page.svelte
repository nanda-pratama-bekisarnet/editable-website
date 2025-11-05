<script>
  let file = null;
  let uploadedId = null;

  async function upload() {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/assets', { method: 'POST', body: formData });
    const data = await res.json();
    uploadedId = data.asset_id;
  }
</script>

<h1>Upload Image</h1>
<input type="file" bind:files={file} />
<button on:click={upload}>Upload</button>

{#if uploadedId}
  <h2>Uploaded Image:</h2>
  <img src={`/api/assets?id=${uploadedId}`} alt="Uploaded Image" width="300" />
{/if}
