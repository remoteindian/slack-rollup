<script>
  import { usersStore } from "./store";
  import { getMessageHTML } from "./slack";
  import Message from "./Message.svelte";
  import Toggle from "@beyonk/svelte-toggle";

  export let startDate, endDate;
  var title = "📧 Awesome slack newsletter";
  let showHTML = false;
  var sections = [
    {
      title: "⭐ Highlights ⭐",
      messages: []
    }
  ];
  function addSection() {
    sections = [...sections, { title: "New Section", messages: [] }];
  }

  function drop(event, index) {
    const message = JSON.parse(event.dataTransfer.getData("text"));
    const section = sections[index];
    sections[index] = {
      title: section.title,
      messages: [...section.messages, message]
    };
  }

  function onMessageRemove(sectionIndex, messageIndex) {
    const section = sections[sectionIndex];
    sections[sectionIndex] = {
      title: section.title,
      messages: section.messages.filter((message, i) => i !== messageIndex)
    };
  }

  function removeSection(sectionIndex) {
    sections = sections.filter((sections, i) => i !== sectionIndex);
  }

  function getSectionsHtml() {
    if (sections) {
      return sections.reduce((html, section) => {
        return (
          html +
          `<div style="padding:0.5em 0;">
          <h3>${section.title}</h3>
          ${section.messages.map(message => getMessageHTML(message)).join("")}
        </div>`
        );
      }, "");
    }
    return "";
  }
  function getCode() {
    return `<div>
    <div style="display:flex;flex-direction:column;"><h2 style="margin-bottom:0">${title}</h2>
    <b style="color:#999;margin-bottom:0.3em">${new Date(
      startDate
    ).toDateString()} - ${new Date(endDate).toDateString()}</b>
    </div>
    <div>${getSectionsHtml()}</div>
    </div>`;
  }
</script>

<style>
  .dashed-border {
    border: 1px dashed #ddd;
  }

  .dashed-border-hover {
    border: 1px solid transparent;
  }

  .dashed-border-hover:hover {
    border: 1px dashed #ddd;
  }
  .builder {
    border: slategray solid 1px;
    padding: 0.5em;
  }
  .header {
    display: flex;
    flex-direction: column;
  }
  .button {
    margin-top: 1em;
    width: 100%;
  }
  .bold {
    font-weight: bold;
  }
  .hint {
    text-align: center;
    color: rgba(0, 0, 0, 0.5);
  }
  .section {
    padding: 0.5em;
  }
  .panel {
    overflow-y: scroll;
    height: 75vh;
  }
  .header h2 {
    width: 100%;
    margin-bottom: 0 !important;
  }

  .section-header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
  .section-header h3 {
    width: 100%;
  }
  code {
    display: block;
    padding: 1rem;
    word-wrap: break-word;
    white-space: normal;
    overflow-x: auto;
  }
  .date {
    color: #999;
    margin-bottom: 0.3em;
  }
</style>

<div class="row">
  <div class="column">
    <Toggle bind:checked={showHTML} onLabel="Hide HTML" offLabel="Show HTML" />
  </div>
</div>
<div class="builder panel">
  {#if showHTML}
    <code>{getCode()}</code>
  {:else}
    <div class="header">
      <h2
        class="bold dashed-border-hover"
        bind:textContent={title}
        contenteditable="true">
        {title}
      </h2>
      <b class="date">
        {new Date(startDate).toDateString()} - {new Date(endDate).toDateString()}
      </b>
    </div>
    <div class="sections">
      {#each sections as section, i}
        <div
          class="section dashed-border"
          ondragover="return false"
          on:drop|preventDefault={event => drop(event, i)}>
          <div class="section-header">
            <h3
              class="bold dashed-border-hover"
              contenteditable="true"
              bind:textContent={section.title}>
              {section.title}
            </h3>
            <span class="close" on:click={() => removeSection(i)}>
              <b>x</b>
            </span>

          </div>
          {#if section.messages.length == 0}
            <p class="hint">
              Drag messages from the left to add it under a section
            </p>
          {:else}
            {#each section.messages as message, messageIndex}
              <Message
                {message}
                users={$usersStore}
                removable={true}
                on:remove={() => onMessageRemove(i, messageIndex)} />
            {/each}
          {/if}
        </div>
      {/each}
    </div>
    <button on:click={addSection} class="button button-outline">
      Add section
    </button>
  {/if}
</div>
