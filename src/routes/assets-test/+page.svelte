<script>
  let file = null;       // will store a single File
  let uploadedId = null;

  async function upload() {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/assets', { method: 'POST', body: formData });
    const data = await res.json();
    uploadedId = data.asset_id;
  }

  function handleFileChange(event) {
    file = event.target.files[0]; // take the first selected file
  }
</script>

<h1>Upload Image</h1>
<input type="file" on:change={handleFileChange} />
<button on:click={upload}>Upload</button>

{#if uploadedId}
  <h2>Uploaded Image:</h2>
  <img src={`/api/assets?id=${uploadedId}`} alt="Uploaded Image" width="300" />
{/if}
