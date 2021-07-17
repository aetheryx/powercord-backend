/*
 * Copyright (c) 2018-2021 aetheryx & Cynthia K. Rey
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { CommandClient, GuildTextableChannel, Message } from 'eris'
import fetch from 'node-fetch'
import { prettyPrintTimeSpan, stringifyDiscordMessage, sanitizeMarkdown } from '../../util.js'
import config from '../../config.js'

type MessagePartial = { id: string, channel: GuildTextableChannel }

export const deleteMeta = new Map<string, string>()

const ZWS = '\u200B'
const SINGLE_TEMPLATE = `Message deleted in <#$channelId> $meta
Author: $username#$discrim ($userId; <@$userId>)
Timestamp: $time ($duration ago)
Message contents: \`\`\`
$message
\`\`\``
const LIST_TEMPLATE = `Message deleted in #$channel $meta
Author: $username#$discrim ($userId)
Timestamp: $time ($duration ago)
Message contents:
$message`

async function format (template: string, message: Message<GuildTextableChannel>): Promise<string> {
  const attachments = message.attachments.length > 0
    ? `Attachments:\n${message.attachments.map((attachment) => attachment.filename).join(', ')}`
    : ''

  const meta = deleteMeta.has(message.id)
    ? `\nReason: ${deleteMeta.get(message.id)}`
    : ''

  const tooLong = message.content.length > 1700
  let hasteBin = ''

  if (tooLong) {
    const res = await fetch('https://haste.powercord.dev/documents', {
      method: 'POST',
      body: stringifyDiscordMessage(message),
    }).then((r) => r.json())
    hasteBin = `<https://haste.powercord.dev/${res.key}.txt>`
  }

  deleteMeta.delete(message.id)
  return `${template
    .replace(/\$meta/g, meta)
    .replace(/\$userId/g, message.author.id)
    .replace(/\$channelId/g, message.channel.id)
    .replace(/\$channel/g, message.channel.name)
    .replace(/\$username/g, sanitizeMarkdown(message.author.username))
    .replace(/\$discrim/g, message.author.discriminator)
    .replace(/\$time/g, new Date(message.timestamp).toUTCString())
    .replace(/\$duration/g, prettyPrintTimeSpan(Date.now() - message.timestamp))
    .replace(/\$message/g, tooLong
      ? '*Message too long*'
      : stringifyDiscordMessage(message).replace(/`/g, `\`${ZWS}`)
      || '*No contents*')}${hasteBin}\n${attachments}`
}

async function messageDelete (this: CommandClient, msg: Message<GuildTextableChannel>) {
  if (!msg.author || msg.author.bot || msg.channel.guild.id !== config.discord.ids.serverId) {
    return // Let's just ignore
  }

  this.createMessage(config.discord.ids.channelMessageLogs, {
    content: await format(SINGLE_TEMPLATE, msg),
    allowedMentions: {},
  })
}

async function messageDeleteBulk (this: CommandClient, msgs: Array<Message<GuildTextableChannel> | MessagePartial>) {
  if (msgs[0].channel.guild.id !== config.discord.ids.serverId) {
    return // Let's just ignore
  }

  const list = msgs.map(
    (msg) =>
      'author' in msg
        ? format(LIST_TEMPLATE, msg)
        : `A message in #${msg.channel.name} that was not cached`
  ).join('\n\n')

  const res = await fetch('https://haste.powercord.dev/documents', { method: 'POST', body: list.trim() }).then((r) => r.json())
  this.createMessage(config.discord.ids.channelMessageLogs, `${msgs.length} messages deleted:\n<https://haste.powercord.dev/${res.key}.txt>`)
}

export default function (bot: CommandClient) {
  if (!config.discord.ids.channelMessageLogs) {
    console.log('no channel ids provided for message logs. module will be disabled.')
    return
  }

  bot.on('messageDelete', messageDelete)
  bot.on('messageDeleteBulk', messageDeleteBulk)
}
