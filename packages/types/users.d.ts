/*
 * Copyright (c) 2018-2022 Powercord Developers
 * Licensed under the Open Software License version 3.0
 */

type ExternalAccount = {
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  name: string
}

export type User = {
  _id: string
  username: string
  discriminator: string
  avatar: string | null
  accounts: {
    discord: Omit<ExternalAccount, 'name'>
    spotify?: ExternalAccount
    github?: ExternalAccount
    patreon?: ExternalAccount
  }
  badges?: {
    developer?: boolean
    staff?: boolean
    support?: boolean
    contributor?: boolean
    hunter?: boolean
    early?: boolean
    translator?: boolean // todo: array(?) of langs
    custom?: {
      color: string | null
      icon: string | null
      name: string | null
    }
    guild?: {
      id: string | null
      icon: string | null
      name: string | null
    }
  }
  patronTier?: 0 | 1 | 2
  createdAt: Date
  updatedAt?: Date
}

export type UserBanStatus = {
  _id: string
  account: boolean
  publish: boolean
  verification: boolean
  hosting: boolean
  reporting: boolean
  sync: boolean
  events: boolean
}

export type RestUser = Omit<User, '_id' | 'accounts' | 'createdAt'> & {
  id: User['_id']
  accounts?: {
    spotify?: string
    github?: string
    patreon?: string
  }
}

export type RestAdminUser = RestUser & { banStatus?: UserBanStatus }

export type RestAdminBans = UserBanStatus & { user?: RestAdminUser }

export type MinimalUser = {
  id: string
  username: string
  discriminator: string
  avatar: string | null
}
