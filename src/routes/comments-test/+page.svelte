<script lang="ts">
 import { onMount } from 'svelte';

 interface Comment {
  id: number;
  content: string;
  created_at: string;
 }

 let comments = $state<Comment[]>([]);
 let newComment = $state('');

 // Fetch comments from the API
 async function fetchComments() {
  const response = await fetch('/api/comments');
  const data = await response.json();

  if (response.ok) {
   comments = data.comments;
  } else {
   console.error('Failed to fetch comments');
  }
 }

 // Add a new comment
 async function addComment() {
  // Ignore empty comments
  if (!newComment.trim()) return;

  const response = await fetch('/api/comments', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json'
   },
   body: JSON.stringify({ content: newComment.trim() })
  });

  await fetchComments(); // Refresh the list
 }

 // Delete a comment
 async function deleteComment(id: number) {
  const response = await fetch(`/api/comments?id=${id}`, {
   method: 'DELETE'
  });

  await fetchComments(); // Refresh the list
 }

 // Format date for display
 function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
 }

 // Load comments on mount
 onMount(fetchComments);
</script>

<svelte:head>
 <title>Comments Test - Database Testing</title>
</svelte:head>

<div style="max-width: 56rem; margin-left: auto; margin-right: auto; padding: 1.5rem;">
 <h1 style="margin-bottom: 1.5rem; font-size: 1.875rem; line-height: 2.25rem; font-weight: 700;">
  Comments Test Page
 </h1>
 <p style="margin-bottom: 2rem; color: #4B5563;">
  This page tests the D1 database functionality with persistent comments. You can add, view, and
  delete comments.
 </p>

 <!-- Add Comment Form -->
 <div
  style="margin-bottom: 2rem; border-radius: 0.5rem; border: 1px solid #E5E7EB; background-color: white; padding: 1.5rem;"
 >
  <h2 style="margin-bottom: 1rem; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600;">
   Add New Comment
  </h2>
  <form style="display: flex; flex-direction: column; gap: 1.5rem;">
   <div>
    <label for="comment" style="color: black;">
     Comment <span style="color: #F87171;">*</span>
    </label>
    <textarea bind:value={newComment} style="width: 100%; border-radius: 0.5rem; color: black;"
    ></textarea>
   </div>
   <button
    onclick={addComment}
    style="background: #6366f1; border-radius: 2rem; padding: 0.5rem 1rem; color: #fff; cursor: pointer;"
   >
    Add Comment
   </button>
  </form>
 </div>

 <!-- Comments List -->
 <div style="border-radius: 0.5rem; background-color: white; padding: 1.5rem;">
  <h2 style="margin-bottom: 1rem; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600;">
   Comments ({comments.length})
  </h2>

  <div style="display: flex; flex-direction: column; gap: 1rem;">
   {#each comments as comment (comment.id)}
    <div style="border-radius: 0.5rem; border: 1px solid #E5E7EB; padding: 1rem;">
     <div style="display: flex; align-items: flex-start; justify-content: space-between;">
      <div style="flex: 1;">
       <p style="margin-bottom: 0.5rem; color: #1F2937;">{comment.content}</p>
       <p style="font-size: 0.875rem; line-height: 1.25rem; color: #6B7280;">
        Posted on {formatDate(comment.created_at)}
       </p>
      </div>
      <button
       onclick={() => deleteComment(comment.id)}
       style="background: #dc2626; border-radius: 2rem; padding: 0.25rem 1rem; color: #fff; cursor: pointer;"
      >
       Delete
      </button>
     </div>
    </div>
   {/each}
  </div>
 </div>
</div>

<style></style>