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

import type { CommandClient, Guild, GuildAuditLogEntry, GuildTextableChannel, Member, Message } from 'eris'
import { readdir, stat } from 'fs/promises'
import { URL } from 'url'
import config from './config.js'

const DURATION_MAP = { m: 60e3, h: 3600e3, d: 86400e3 }
const BYTE_UNITS = [ 'B', 'KB', 'MB', 'GB', 'TB' ]

/**
 * Await this to wait for `time` ms.
 * @param time - The amount of time to wait in ms
 * @returns a promise that will resolve in `time` ms
 */
export async function sleep (time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time))
}

/**
 * Recursively find all files in a given path.
 * @param path - The starting path.
 * @returns an array of all non-directory files in `path` and all subdirectories
 */
export async function readdirRecursive (path: URL): Promise<string[]> {
  const entries = await readdir(path)
  const pending: Array<Promise<string[]>> = []
  const files: string[] = []
  for (const entry of entries) {
    const entryUrl = new URL(`./${entry}`, path)
    const res = await stat(entryUrl)
    if (res.isDirectory()) {
      entryUrl.pathname += '/'
      pending.push(readdirRecursive(entryUrl))
    } else {
      files.push(entryUrl.pathname)
    }
  }

  return Promise.all(pending).then((found) => files.concat(...found))
}

/**
 * Append `s` to a string to pluralize it if `count` dictates it.
 * @param string - The string to maybe append `s` to
 * @param count - Appends `s` to `string` if `count` is not one
 * @returns The pluralized string
 */
export function makePluralDumb (string: string, count: number) {
  return count === 1 ? string : `${string}s`
}

/**
 * Capitalizes a string
 * @param string - The string to capitalize
 * @returns The pluralized string
 */
export function capitalize (string: string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase()
}

/**
 * Convert a timespan in ms to a human readable representation of that timespan.
 * @param time - a timespan in ms
 * @returns a string that is a human friendly representation of `time`
 */
export function prettyPrintTimeSpan (time: number) {
  const y = Math.floor(time / 31536000e3)
  time -= y * 31536000e3
  const d = Math.floor(time / 86400e3)
  time -= d * 86400e3
  const h = Math.floor(time / 3600e3)
  time -= h * 3600e3
  const m = Math.floor(time / 60e3)
  time -= m * 60e3
  const s = Math.floor(time / 1e3)

  return [
    y && `${y} ${makePluralDumb('year', y)}`,
    d && `${d} ${makePluralDumb('day', d)}`,
    h && `${h} ${makePluralDumb('hour', h)}`,
    m && `${m} ${makePluralDumb('minute', m)}`,
    s && `${s} ${makePluralDumb('second', s)}`,
  ].filter(Boolean).join(', ') || 'under a second'
}

/**
 * Convert a message object into a string with mentions replaced by the name of whatever they are mentioning.
 * @param message - the message to convert
 * @returns a string with the contents of `message` but with mentions parsed
 */
export function stringifyDiscordMessage (message: Message<GuildTextableChannel>) {
  return message.content
    .replace(/<a?(:\w+:)[0-9]+>/g, '$1')
    .replace(/<@!?([0-9]+)>/g, (_, id) => `@${message.channel.guild.members.get(id)?.nick ?? message._client.users.get(id)?.username ?? 'invalid-user'}`)
    .replace(/<@&([0-9]+)>/g, (_, id) => `@${message.channel.guild.roles.get(id)?.name ?? 'invalid-role'}`)
    .replace(/<#([0-9]+)>/g, (_, id) => `#${message.channel.guild.channels.get(id)?.name ?? 'deleted-channel'}`)
}

/**
 * Convert a human readable duration to its numerical representation.
 * @param duration - the human readable duration string
 * @returns the numerical representation of `duration` in ms
 */
export function parseDuration (duration: string): number | null {
  const match = duration.match(/^(\d+)([mhd])$/)
  if (!match) return null

  return Number(match[1]) * DURATION_MAP[match[2] as keyof typeof DURATION_MAP]
}

/**
 * Determine if a user is a staff member.
 * @param member - the user id or member object to check
 * @param guild - the guild `member` belongs to **only required if `member` is a user id**
 * @returns true if `member` has the `manageMessage` permission, false otherwise
 */
export function isStaff (member: Member | string, guild?: Guild): boolean {
  if (typeof member !== 'string') {
    return member.permissions.has('manageMessages')
  }

  if (!guild) throw new TypeError('Guild required when using user id.')

  return guild.members.get(member)?.permissions.has('manageMessages') ?? false
}

/**
 * Sanitizes a markdown string to prevent them from being parsed (for example by the Discord client)
 *
 * @param md Markdown string to sanitize
 * @returns The sanitized string
 */
export function sanitizeMarkdown (md: string): string {
  return md.replace(/([*_~`>\\])/g, '\\$1')
}

/**
 * Formats a value in bytes to a more easily readable size
 * @param bytes The size in bytes to pretty print
 * @returns The pretty size with unit
 */
export function prettyPrintBytes (bytes: number): string {
  let unitIdx = 0
  while (bytes > 2 ** 10 && unitIdx < BYTE_UNITS.length - 1) {
    bytes /= 2 ** 10
    unitIdx++
  }

  return `${bytes.toFixed(2)} ${BYTE_UNITS[unitIdx]}`
}

/**
 * Data pertaining to an Audit Log Entry.
 */
export type AuditEntryData = {
  modId: string,
  modName: string,
  reason: string;
}

/**
 * Extract data from a GuildAuditLogEntry.
 * @param entry The GuildAuditLogEntry from which to extract the data
 * @returns A `AuditEntryData` containing data from `entry`
 */
export function extractEntryData (entry: GuildAuditLogEntry): AuditEntryData {
  let modId = ''
  let modName = ''
  let reason = ''

  if (entry.user.id === config.discord.clientID && entry.reason?.startsWith('[')) {
    const splittedReason = entry.reason.split(' ')
    modName = splittedReason.shift()!.replace('[', '').replace(']', '')
    reason = splittedReason.join(' ')
    const [ username, discrim ] = modName.split('#')
    const mod = entry.guild.members.find((m) => m.username === username && m.discriminator === discrim)
    modId = mod ? mod.id : '<unknown>' // Should not happen
  } else {
    modId = entry.user.id
    modName = `${entry.user.username}#${entry.user.discriminator}`
    reason = entry.reason || 'No reason specified.'
  }

  return { modId: modId, modName: modName, reason: reason }
}

export function delayedFunction (fn: Function): () => void {
  return function (this: CommandClient, ...args: unknown[]) {
    setTimeout(() => fn.apply(this, args), 2e3)
  }
}
