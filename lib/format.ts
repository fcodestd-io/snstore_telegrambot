import type { Context } from "telegraf";

import { chunkText, escapeHtml } from "./utils";

export function formatAiReply(raw: string): string {
  let text = raw
    .replace(/\r\n/g, "\n")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/User Safety:\s*safe/gi, "")
    .replace(/Safety status:\s*safe/gi, "")
    .replace(/System Instruction:/gi, "");

  // Hilangkan wrapper code block.
  text = text.replace(/```[a-z]*\n?([\s\S]*?)```/gi, "$1");

  // Ubah tabel markdown menjadi baris biasa.
  text = text
    .split("\n")
    .filter(
      (line) => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line),
    )
    .map((line) => {
      if (!/^\s*\|.*\|\s*$/.test(line)) {
        return line;
      }

      return line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((column) => column.trim())
        .filter(Boolean)
        .join(" — ");
    })
    .join("\n");

  // Hilangkan horizontal rule.
  text = text.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, "");

  text = escapeHtml(text);

  // Heading markdown -> bold Telegram.
  text = text.replace(
    /^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm,
    (_match, heading: string) => `<b>${heading.replace(/\*\*|__/g, "")}</b>`,
  );

  // Bullet.
  text = text.replace(/^[ \t]*[-*+][ \t]+/gm, "• ");

  // Bold.
  text = text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/__(.+?)__/g, "<b>$1</b>");

  // Italic.
  text = text.replace(
    /(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,!?:;]|$)/g,
    "$1<i>$2</i>",
  );

  // Inline code.
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Markdown link -> text + URL.
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)");

  return text
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToPlain(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export async function sendHtmlSafe(ctx: Context, html: string) {
  for (const part of chunkText(html)) {
    try {
      await ctx.reply(part, {
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: true,
        },
      });
    } catch {
      await ctx.reply(htmlToPlain(part));
    }
  }
}
