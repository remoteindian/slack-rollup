import { usersStore } from "./store";
import { emojis } from "./static";
import { get } from "svelte/store";
import { element } from "svelte/internal";

const acceptedImageTypes = ["gif", "png", "jpg"];

export function getDate(message) {
  return new Date(
    Number(message.timestamp.split(".")[0]) * 1000
  ).toDateString();
}

function escapeControlCharacters(string) {
  return string
    .replace(/\&/g, "&amp;")
    .replace(/\>/g, "&gt;")
    .replace(/\</g, "&lt;");
}

export function getFormattedText(message) {
  const user = get(usersStore)[message.user];
  if (!message.blocks || message.blocks.length === 0 || user.bot_id) {
    return message.text;
  }
  const elements = message.blocks.flatMap((block) => {
    if(block.elements !== undefined){
      return block.elements.flatMap((element) => element.elements)
    }else
    {
      return []
    }
  });

  var text = message.text;
  elements.forEach((element) => {
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
        `<b>@${get(usersStore)[element.user_id].display_name || "notfound"}</b>`
      );
    } else if (element.type === "emoji") {
      text = text.replace(
        `:${element.name}:`,
        emojis[element.name] || `:${element.name}:`
      );
    } else if (element.type === "text" && element.style) {
      const elementText = escapeControlCharacters(element.text);
      if (element.style.bold === true) {
        text = text.replace(
          new RegExp(`\\*${elementText}\\*`),
          `<b>${element.text}</b>`
        );
      }
      if (element.style.italic === true) {
        text = text.replace(
          new RegExp(`_${elementText}_`),
          `<i>${element.text}</i>`
        );
      }

      if (element.style.code === true) {
        text = text.replace(
          new RegExp("`" + elementText + "`"),
          `<code>${element.text}</code>`
        );
      }
    }
  });

  // Replace new lines with line breaks
  text = text.replace(/\n/g, "<br />");
  var imagesHTML = "";
  if (message.files && message.files.length > 0) {
    message.files
      .filter((file) => acceptedImageTypes.indexOf(file.filetype) != -1)
      .forEach((file) => {
        imagesHTML += `<img style="margin-top:0.3em;width:100%;height:auto;" alt=${file.title} src="${file.url_private}"/>`;
      });
  }
  return text + imagesHTML;
}

export function getReactionsHTML(message) {
  if (message.reactions) {
    return message.reactions.reduce((html, reaction) => {
      return (
        html +
        `<span style="font-size:1rem;margin-right:0.8em;">${
          emojis[reaction.name] || `:${reaction.name}:`
        } ${reaction.count}</span>`
      );
    }, "");
  }
  return "";
}

export function getMessageHTML(message) {
  const user = get(usersStore)[message.user];
  return `<div style="padding:1em;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);"><div style="display:flex;flex-direction:row;"><img style="width:48px;height:48px;margin-right:1em;border-radius: 50%;" src="${
    user.image_72
  }"/><div style="display:flex;flex-direction:column;align-items:flex-start;"><b>${
    user.real_name
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
