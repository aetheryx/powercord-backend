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

import type { CommandClient, Message, GuildTextableChannel, Guild, Invite } from 'eris'
import { URL } from 'url'
import { readFileSync } from 'fs'
import { deleteMeta } from './logger.js'
import { skipSnipe } from '../sniper.js'
import { Period, getPeriod, ban, mute } from '../../mod.js'
import { isStaff } from '../../util.js'
import config from '../../config.js'

const NAMES = JSON.parse(readFileSync(new URL('../../../twemojiNames.json', import.meta.url), 'utf8'))
const INVITE_RE_SRC = '(?:https?:\\/\\/)?(?:www\\.)?(discord\\.(?:gg|io|me|li|link|list|media)|(?:discord(?:app)?|watchanimeattheoffice)\\.com\\/invite)\\/(.+[a-zA-Z0-9])'
const INVITE_RE_G = new RegExp(INVITE_RE_SRC, 'ig')
const INVITE_RE = new RegExp(INVITE_RE_SRC, 'i')
const INVITE_CHECK_FOR = [
  'discord.gg',
  'discord.media',
  'discord.com/invite',
  'discordapp.com/invite',
  'watchanimeattheoffice.com/invite',
]

const CLEANER = /\s|[\u200B-\u200D\uFEFF]|[\u0300-\u036f]/g
const BAD_POWERCORD = /[Pp]ower[-_.]*([C(]|©️)ord/
const EMOJI_UNICODE_RE = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|(?:<a?:[^:]{2,}:\d{6,}>))/g
const EMOJI_RE = new RegExp(`${NAMES.map((n: string) => `:${n}:`).join('|').replace(/\+/g, '\\+')}|${EMOJI_UNICODE_RE.source}`, 'g')
const MAX_EMOJI_THRESHOLD_MULTIPLIER = 0.3 // Amount of words * mult (floored) = max amount of emojis allowed
const NORMALIZE: [ RegExp, string ][] = [
  [ /АΑ/g, 'A' ],
  [ /ВΒ/g, 'B' ],
  [ /C/g, 'C' ],
  [ /ЕЁΕ/g, 'E' ],
  [ /НΗ/g, 'H' ],
  [ /І/g, 'I' ],
  [ /Κκ/g, 'K' ],
  [ /МΜ/g, 'M' ],
  [ /Ν/g, 'N' ],
  [ /ОØΟ/g, 'O' ],
  [ /РΡ/g, 'P' ],
  [ /Ѕ/g, 'S' ],
  [ /ТΤ/g, 'T' ],
  [ /Ѵ/g, 'V' ],
  [ /ХΧ/g, 'X' ],
  [ /Υ/g, 'Y' ],
  [ /Ζ/g, 'Z' ],
  [ /аα/g, 'a' ],
  [ /с/g, 'c' ],
  [ /её/g, 'e' ],
  [ /9/g, 'g' ],
  [ /ıіι/g, 'i' ],
  [ /с/g, 'c' ],
  [ /оø0ο/g, 'o' ],
  [ /рρ/g, 'p' ],
  [ /υ/g, 'u' ],
  [ /ѕ/g, 's' ],
  [ /ѵν/g, 'v' ],
  [ /х/g, 'x' ],
  [ /Ууγ/g, 'y' ],
]

export const BLACKLIST_CACHE: string[] = []

const correctedPeople = new Map<string, number>()

function takeAction (msg: Message, reason: string, warning: string, loose?: boolean) {
  skipSnipe.add(msg.id)
  deleteMeta.set(msg.id, reason)
  msg.delete(reason)

  if (!msg.member) return // ??
  const period = getPeriod(msg.member)
  if (!loose && period === Period.PROBATIONARY) {
    ban(msg.member.guild, msg.author.id, null, `Automod: ${reason} (New member)`)
    return
  }

  if (period === Period.RECENT) {
    mute(msg.member.guild, msg.author.id, null, `Automod: ${reason} (Recent member)`, 24 * 3600e3)
  }

  msg.channel.createMessage({ content: warning, allowedMentions: { users: [ msg.author.id ] } })
    .then((m) => setTimeout(() => m.delete(), 10e3))
}

async function process (this: CommandClient, msg: Message<GuildTextableChannel>) {
  if (msg.guildID !== config.discord.ids.serverId || msg.author.bot || isStaff(msg.member)) return null
  let normalizedMessage = msg.content.normalize('NFD')
  for (const [ re, rep ] of NORMALIZE) {
    normalizedMessage = normalizedMessage.replace(re, rep)
  }
  const cleanMessage = msg.content.normalize('NFD').replace(CLEANER, '')

  // Filter bad words
  if (!BLACKLIST_CACHE.length) {
    const b = await this.mongo.collection('blacklist').find().toArray()
    BLACKLIST_CACHE.push(...b.map((e) => e.word))
  }

  if (BLACKLIST_CACHE.some((word) => cleanMessage.toLowerCase().includes(word))) {
    takeAction(msg, 'Message contained a blacklisted word', `${msg.author.mention} Your message has been deleted because it contained a word blacklisted.`)
    return // No need to keep checking for smth else
  }

  // Filter ads
  const invites = msg.content.match(INVITE_RE_G)
  if (invites) {
    for (const invite of invites) {
      const [ , url, code ] = invite.match(INVITE_RE)!
      if (INVITE_CHECK_FOR.includes(url)) {
        const inv = await this.getInvite(code)
        if (inv && inv.guild?.id === config.discord.ids.serverId) continue
      }

      takeAction(msg, 'Advertisement', `${msg.author.mention} **Rule #02**: Advertising of any kind is prohibited.`)
      return // No need to keep checking for smth else
    }
  }

  // Filter emoji spam
  const emojis = msg.content.match(EMOJI_RE)?.length || 0
  if (emojis > 5) {
    const words = msg.content.replace(EMOJI_RE, '').split(/\s+/g).filter(Boolean).length
    const max = Math.floor(words * MAX_EMOJI_THRESHOLD_MULTIPLIER)
    if (emojis > max) {
      takeAction(msg, 'Emoji spam', `${msg.author.mention} **Rule #03**: Spam of any kind is prohibited.\nConsider reducing the amount of emojis in your message.`, true)
      return // No need to keep checking for smth else
    }
  }

  // Deal with people who can't write
  if (BAD_POWERCORD.test(cleanMessage)) {
    const count = (correctedPeople.get(msg.author.id) || 0) + 1
    skipSnipe.add(msg.id)
    deleteMeta.set(msg.id, 'Improper writing of Powercord')

    msg.delete('Improper writing of Powercord')
    if (count === 3) {
      msg.channel.createMessage({ content: 'I said: **There is no uppercase C**. "Powercord".', allowedMentions: {} })
      mute(msg.channel.guild, msg.author.id, null, 'Can\'t spell "Powercord" (3rd time)', 300e3)
      correctedPeople.set(msg.author.id, 0)
    } else {
      msg.channel.createMessage({
        content: count === 2
          ? 'There is no uppercase C. "Powercord". You shouldn\'t try again.'
          : 'There is no uppercase C. "Powercord".',
        allowedMentions: {},
      })
      correctedPeople.set(msg.author.id, count)
    }
  }
}

function checkInvite (guild: Guild, invite: Invite) {
  const member = invite.inviter && guild.members.get(invite.inviter.id)
  console.log(member?.username)
  if (!member) return

  const channel = guild.channels.get(invite.channel.id)
  console.log(channel?.name)
  if (!channel) return

  if (!channel.permissionsOf(member).has('readMessages')) {
    invite.delete('Honeypot: no permissions to see channel but created an invite')

    // todo: ban instead of logging
    const staff = guild.channels.get(config.discord.ids.channelStaff) as GuildTextableChannel | undefined
    staff?.createMessage({ content: `:eyes: ${invite.code} <@${member.id}> ${member.username}#${member.discriminator} <#${invite.channel.id}>`, allowedMentions: {} })
  }

  // todo: check if user is muted, flag invite as suspicious
}

export default function (bot: CommandClient) {
  bot.on('messageCreate', process)
  bot.on('messageUpdate', process)
  bot.on('inviteCreate', checkInvite)
}
