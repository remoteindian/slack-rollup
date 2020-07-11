<script>
  import { emojis } from "./static";
  import Toggle from "@beyonk/svelte-toggle";
  import { createEventDispatcher } from "svelte";
  import { getMessageHTML, getDate, getFormattedText } from "./slack";
  const dispatch = createEventDispatcher();

  export let message;
  export let draggable = false;
  export let removable = false;

  function removeMessage() {
    dispatch("remove");
  }

  function handleDragStart(event) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.dropEffect = "copy";
    event.dataTransfer.setData("text", JSON.stringify(message));
  }
</script>

<style>
  .card {
    padding: 1em;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  }
  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .header .left {
    display: flex;
    flex-direction: row;
  }
  .profile-image {
    width: 48px;
    height: 48px;
    margin-right: 1em;
    border-radius: 50%;
  }
  .header-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .header-details p {
    font-size: 1.3rem;
    font-weight: 200;
  }
  .message {
    overflow-wrap: break-word;
    margin-bottom: 1em;
  }
  .stats {
    display: flex;
    flex-direction: row;
  }
  .stat {
    font-size: 1.5rem;
    margin-right: 0.8em;
  }
</style>

<div class="card" {draggable} on:dragstart={handleDragStart}>
  <div class="header">
    <div class="left">
      <img class="profile-image" src={message.user.image_72} />
      <div class="header-details">
        <b>{message.user.real_name}</b>
        <p>{getDate(message)} in #{message.channel}</p>
      </div>
    </div>
    <div class="right">
      {#if removable}
        <span class="close" on:click={removeMessage}>
          <b>x</b>
        </span>
      {/if}
    </div>
  </div>
  <div class="message">
    {@html getFormattedText(message)}
  </div>
  <div class="stats">
    {#if message.replies}
      <span class="stat">💬 Replies: {message.replies.length}</span>
    {/if}
    {#if message.reactions}
      {#each message.reactions as reaction}
        <span class="stat">
          {@html emojis[reaction.name] || `:${reaction.name}:`}
          {reaction.count}
        </span>
      {/each}
    {/if}
  </div>
</div>
