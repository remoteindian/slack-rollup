<script>
  import { emojis } from "./static";
  import Toggle from "@beyonk/svelte-toggle";

  let showHTML = false;

  export let message;
  export let users;
  
  function getDate(message) {
    return new Date(
      Number(message.timestamp.split(".")[0]) * 1000
    ).toDateString();
  }
  function getFormattedText(message) {
    if (!message.blocks || message.blocks.length === 0) {
      return message.text;
    }
    const elements = message.blocks[0].elements[0].elements;
    var text = message.text;
    elements.forEach(element => {
      if (element.type === "link") {
        const sanitezedUrl = element.url.replace(/\\/g, "");
        const regex = new RegExp(`<${element.url}.*>`);
        text = text.replace(
          regex,
          `<a href="${sanitezedUrl}">${element.text || sanitezedUrl}</a>`
        );
      } else if (element.type === "user") {
        const regex = new RegExp(`<@${element.user_id}>`);
        text = text.replace(
          regex,
          `<b>@${users[element.user_id] || "notfound"}</b>`
        );
      } else if (element.type === "emoji") {
        text = text.replace(
          `:${element.name}:`,
          emojis[element.name] || `:${element.name}:`
        );
      } else if (
        element.type === "text" &&
        element.style &&
        element.style.bold === true
      ) {
        text = text.replace(`*${element.text}*`, `<b>${element.text}</b`);
      }
    });
    return text;
  }

  function getReactionsHTML(message) {
    if (message.reactions) {
      return message.reactions.reduce((html, reaction) => {
        return (
          html +
          `<span style="font-size:1rem;margin-right:0.8em;">${emojis[
            reaction.name
          ] || `:${reaction.name}:`} ${reaction.count}</span>`
        );
      }, "");
    }
    return "";
  }

  function getCode(message) {
    return `<div style="padding:1em;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);"><div style="display:flex;flex-direction:row;"><img style="width:48px;height:48px;margin-right:1em;border-radius: 50%;" src="${
      message.user.image_72
    }"/><div style="display:flex;flex-direction:column;align-items:flex-start;"><b>${
      message.user.real_name
    }</b><span style="font-size:1rem;">${getDate(message)} in #${
      message.channel
    }</span></div></div><div style="overflow-wrap:break-word;margin-bottom:1em;">${getFormattedText(
      message
    )}</div><div style="display:flex;flex-direction:row;">${
      message.replies
        ? `<span style="font-size:1rem;margin-right:0.8em;">💬 Replies: ${message.replies.length}</span>`
        : ""
    }${getReactionsHTML(message)}</div></div>`;
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
  pre {
    overflow-x: auto;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
  }
  code {
    display: block;
    padding: 1rem;
    word-wrap: break-word;
    overflow-x: auto;
  }
</style>

<div class="card">
  <Toggle bind:checked={showHTML} onLabel="Hide HTML" offLabel="Show HTML" />
  {#if showHTML}
    <code>{getCode(message)}</code>
  {:else}
    <div class="header">
      <img class="profile-image" src={message.user.image_72} />
      <div class="header-details">
        <b>{message.user.real_name}</b>
        <p>{getDate(message)} in #{message.channel}</p>
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
  {/if}
</div>
