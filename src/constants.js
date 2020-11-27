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

export const Endpoints = Object.freeze({
  LOGIN: '/api/v2/login',
  LOGOUT: '/api/v2/logout',
  ADVISORIES: '/api/v2/advisories',
  ADVISORY: (id) => `/api/v2/advisories/${id}`,
  LINK_SPOTIFY: '/api/v2/oauth/spotify',
  UNLINK_SPOTIFY: '/api/v2/oauth/spotify/unlink',
  YEET_ACCOUNT: '/api/v2/oauth/discord/unlink',
  CONTRIBUTORS: '/api/v2/stats/contributors',
  STATS: '/api/v2/stats/numbers',
  DOCS_CATEGORIES: '/api/v2/docs/categories',
  DOCS_DOCUMENT: (doc) => `/api/v2/docs/${doc}`,
  USER_AVATAR: (id) => `/api/v2/avatar/${id}.png`
})

export const Routes = Object.freeze({
  HOME: '/',
  ME: '/me',
  CONTRIBUTORS: '/contributors',
  STATS: '/stats',
  BRANDING: '/branding',
  FAQ: '/faq',
  STORE: '/store',
  DOCS: '/docs',
  GUIDELINES: '/guidelines',
  INSTALLATION: '/installation',
  ADVISORIES: '/advisories',
  ADVISORY: (id) => `/advisories/${id}`,
  LISTING_AGREEMENT: '/listing-agreement',
  PORKORD_LICENSE: '/porkord-license',
  TERMS: '/legal/tos',
  PRIVACY: '/legal/privacy',
  BACKOFFICE: '/backoffice',
  DICKSWORD: 'https://discord.gg/nFRHhDk',
  PATREON: 'https://patreon.com/aetheryx',
  GITHUB: 'https://github.com/powercord-org'
})
