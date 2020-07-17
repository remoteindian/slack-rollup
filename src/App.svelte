<script>
  import Message from "./Message.svelte";
  import Builder from "./Builder.svelte";
  import { usersStore } from "./store";

  let resultPromise;
  var jszip = new JSZip();
  let messages = [];
  let allMessages = [];
  let sortBy = "replies";
  let channel = "all";
  function onUpload(event) {
    let files = event.target.files;
    if (files && files[0] && files[0].type === "application/zip") {
      resultPromise = analyzeSlackDump(files[0]).then(result => {
        allMessages = result.messages;
        filterAndSort();
        return result;
      });
    }
  }

  function onSort(event) {
    sortBy = event.target.value;
    filterAndSort();
  }

  function onChannelSelect(event) {
    channel = event.target.value;
    filterAndSort();
  }

  function filterAndSort() {
    messages = allMessages
      .filter(message => {
        if (channel == "all") {
          return true;
        }
        return message.channel === channel;
      })
      .sort((b, a) => {
        if (sortBy === "reactions") {
          return a.reactionCount - b.reactionCount;
        } else if (sortBy === "replies_reactions") {
          return (
            a.replyCount * 3 +
            a.reactionCount -
            b.replyCount * 3 -
            b.reactionCount
          );
        }
        return a.replyCount - b.replyCount;
      });
  }

  async function analyzeSlackDump(file) {
    const extracted = await jszip.loadAsync(file);
    var processedFiles = [];
    for (let [key, value] of Object.entries(extracted.files)) {
      if (
        value.dir === false &&
        key.endsWith(".json") &&
        key.startsWith("__") === false // Exclude system files
      ) {
        const jsonValue = JSON.parse(await value.async("string"));
        processedFiles.push({ key: key, value: jsonValue });
      }
    }
    const rootPath = processedFiles[0].key.split("/")[0];
    const users = processedFiles
      .find(entry => entry.key === `${rootPath}/users.json`)
      .value.reduce(function(map, obj) {
        map[obj.id] = obj.profile;
        return map;
      }, {});

    const messages = analyzeMessages(processedFiles, users);
    const channels = [...new Set(messages.map(elem => elem.channel))];
    usersStore.set(users);
    return { users, channels, messages };
  }

  function analyzeMessages(processedFiles, users) {
    var messages = [];
    processedFiles.forEach(element => {
      element.value.forEach(jsonElement => {
        if (
          jsonElement.type === "message" &&
          !jsonElement.parent_user_id && // Exclude thread messages
          jsonElement.user &&
          users[jsonElement.user]
        ) {
          try {
            const reactionCount = (jsonElement.reactions || []).reduce(
              (sum, obj) => {
                return sum + obj.count || 0;
              },
              0
            );
            const replyCount = (jsonElement.replies || []).length;
            messages.push({
              channel: element.key.split("/")[1],
              text: jsonElement.text,
              replies: jsonElement.replies,
              replyCount: replyCount,
              reactionCount: reactionCount,
              reactions: jsonElement.reactions,
              user: jsonElement.user,
              timestamp: jsonElement.ts,
              blocks: jsonElement.blocks,
              files: jsonElement.files
            });
          } catch (err) {
            console.error(err.message);
          }
        }
      });
    });
    return messages;
  }
</script>

<style>
  .center {
    text-align: center;
  }
  .panel {
    overflow-y: scroll;
    height: 70vh;
  }
  .header {
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    height: 20vh;
  }
</style>

<main>
  <div class="container">
    <div class="header">
      <div class="row center">
        <div class="column">
          <h1>Slack Rollup</h1>
        </div>
      </div>
      <div class="row center">
        <div class="column">
          <label for="slackDumpUpload">
            Upload Slack export ZIP archive.
            <a
              target="__blank"
              href="https://slack.com/intl/en-gb/help/articles/201658943-Export-your-workspace-data">
              How do I do that?
            </a>
          </label>
          <input
            id="slackDumpUpload"
            type="file"
            accept=".zip"
            on:input={onUpload} />
        </div>
      </div>
    </div>
    {#if resultPromise}
      {#await resultPromise}
        <p class="center">Loading...</p>
      {:then result}
        <div class="row">
          <div class="column column-50">
            <div class="row">
              <div class="column">
                <label for="channel">Select Channel</label>
                <select on:input={onChannelSelect} id="channel">
                  <option value="all" selected>All</option>
                  {#each result.channels as channel}
                    <option value={channel}>{channel}</option>
                  {/each}
                </select>
              </div>
              <div class="column">
                <label for="sort">Sort By</label>
                <select on:input={onSort} id="sort">
                  <option value="replies" selected>Replies</option>
                  <option value="reactions">Reactions</option>
                  <option value="replies_reactions">Replies + Reactions</option>
                </select>
              </div>
            </div>
            <div class="row panel">
              <div class="column">
                {#each messages as message}
                  <Message draggable="true" {message} />
                {/each}
              </div>
            </div>
          </div>
          <div class="column column-50">
            <Builder />
          </div>
        </div>
      {/await}
    {/if}

  </div>
</main>
