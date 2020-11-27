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

const fakeAdv = (lvl) => ({
  id: 'PC-2020-001',
  level: lvl,
  title: 'Fake advisory',
  date: '2020-11-13T10:55:32.490Z',
  plugin: {
    name: 'Fake plugin',
    developer: 'Fake developer'
  },
  publisher: {
    name: 'Fake publisher',
    avatar: 'https://cdn.discordapp.com/avatars/94762492923748352/ad72202b231eb0d8404dd0db15a5edd4.png?size=128',
    low: 1 + Math.floor(Math.random() * 5),
    moderate: 1 + Math.floor(Math.random() * 5),
    high: 1 + Math.floor(Math.random() * 5),
    critical: 1 + Math.floor(Math.random() * 5)
  }
})

const advisories = [ fakeAdv(0), fakeAdv(1), fakeAdv(2), fakeAdv(3) ]

async function getAdvisories (request) {
  return {
    advisories,
    pages: 1
  }
}

async function getAdvisory (request) {
  return request.params.id
}

module.exports = async function (fastify) {
  fastify.get('/', getAdvisories)
  fastify.get('/:id([A-Z]{2,3}-\\d{4}-\\d{3,4})', getAdvisory)
}
