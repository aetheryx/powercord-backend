/*
 * Copyright (c) 2018-2020 aetheryx & Bowser65
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

const config = require('../../../config.json')
const task = require('../../tasks')
const { parseDuration } = require('../../utils')

const USAGE_STR = `Usage: ${config.discord.prefix}mute [mention] (reason)|(duration)`

module.exports = async function (msg, args) {
  if (!msg.member.permission.has('manageMessages')) {
    return msg.channel.createMessage('no')
  }

  if (args.length === 0) {
    return msg.channel.createMessage(USAGE_STR)
  }

  const target = args.shift().replace(/<@!?(\d+)>/, '$1')
  const reason = `${args.join(' ').split('|')[0] || 'No reason specified.'}`
  const rawDuration = msg.content.includes('|') ? msg.content.split('|')[1].trim().toLowerCase().match(/\d+(m|h|d)/) : null

  if (target === msg.author.id) {
    return msg.channel.createMessage('You cannot be silenced')
  }

  if (rawDuration) {
    const duration = parseDuration(rawDuration[0])
    if (duration === null) {
      return msg.channel.createMessage('Invalid duration')
    }

    const entry = task.EMPTY_TASK_OBJ
    entry.type = 'unmute'
    entry.target = target
    entry.mod = `${msg.author.username}#${msg.author.discriminator}`
    entry.time = Date.now() + duration

    msg._client.mongo.collection('tasks').insertOne(entry)
  }

  task.mute(msg._client, target, `${msg.author.username}#${msg.author.discriminator}`, `${reason} ${rawDuration ? `(for ${rawDuration[0]})` : ''}`)
  return msg.channel.createMessage('Shut')
}
