# powercord-backend
The backend for [powercord-org/powercord](https://github.com/powercord-org/powercord).

## Repo structure
 - `boat`: Discord bot for the Powercord server
 - `packages/api`: REST API
 - `packages/web`: Web UI & HTTP server for pre-rendering
 - `packages/boat`: Discord bot for the Powercord server (legacy bot)
 - `packages/crapcord`: Library for interfacing with the Discord API

## License
This software is licensed under the Open Software License 3.0, with a few exceptions:
 - `packages/crapcord` is licensed under BSD-3-Clause
 - `packages/web/src/components/docs/Markdown.tsx` is courtesy of Borkenware as part of Spoonfeed, licensed under BSD-3-Clause
 - Pawa Kodo has been drawn by [Algoinde](https://github.com/Algoinde) and is licensed under [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
   - `packages/web/src/assets/pawa-404.png`
   - `packages/web/src/assets/pawa-knock-head.png`

Previous versions of the backend were released under the MIT license. You may find the last MIT version of the
backend [here](https://github.com/powercord-org/powercord-backend/commit/926c0eedfbf2a627eabfa7b479a8a8d93f506ee8).
