<div align="center">

# Spotify Deck+

**Spotify controls for the Elgato Stream Deck +**
Playback keys, a smooth volume dial, and a library browser you navigate like folders on the touch strip.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md)

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-7.1%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Features

- **Library browser on a dial.** Go from _Now Playing_ up to your playlists, liked songs, artists, saved albums, queue and history, open any of them, and play from the exact track you pick.
- **Works even when Spotify isn't running.** If no device is active, the plugin opens Spotify on this Mac in the background, makes it the playback device, and runs the command you pressed.
- **Live touch-strip UI.** Album art, progress bar, and smooth scrolling for long titles.
- **Responsive controls.** Volume and seek changes are applied instantly and sent to Spotify in batches, so a fast turn doesn't flood the API. Slow commands show a spinner instead of an error.
- **English, Korean and Japanese.** Follows the language of the Stream Deck app.
- **Private by design.** Uses your own Spotify developer app. Tokens stay on your Mac, and the plugin talks only to Spotify.

## Actions

### Keys

| Action          | What it does                                                   |
| --------------- | -------------------------------------------------------------- |
| Play / Pause    | Album art background with the play state                       |
| Previous / Next | Skip tracks                                                    |
| Like            | Add or remove the current track from Liked Songs               |
| Shuffle         | Toggle shuffle                                                 |
| Repeat          | Off → All → One                                                |
| Add to Playlist | Add the current track to a playlist chosen in the key settings |
| Switch Device   | Cycle playback through your Spotify Connect devices            |
| Settings        | Open the settings page (login and status)                      |

### Dials (Stream Deck +)

| Dial            | Rotate                 | Push                             | Touch                              |
| --------------- | ---------------------- | -------------------------------- | ---------------------------------- |
| Playback        | Seek ±5 s (adjustable) | Play / Pause                     | Tap: next · Hold: previous         |
| Volume          | ±2 % (adjustable)      | Mute / Unmute                    | Mute / Unmute                      |
| Library Browser | Scroll                 | Open / Play · Hold: add to queue | Tap: back · Hold: Now Playing      |
| My Playlists    | Scroll                 | Play playlist                    | Tap: current list · Hold: refresh  |
| Liked Songs     | Scroll                 | Play track                       | Tap: current track · Hold: refresh |

The library browser starts at the root:

```
Library
├── Now Playing        (follows the current track)
├── Up Next            (the queue; pressing a track skips to it)
├── My Playlists  ›  playlist  ›  ▶ Play all / tracks
├── Liked Songs
├── Artists       ›  artist    ›  ▶ Play artist / Top tracks › / albums ›
├── Saved Albums  ›  album     ›  ▶ Play album / tracks
└── Recently Played
```

## Requirements

- macOS 12 or later
- Stream Deck app 7.1 or later. The dials need a Stream Deck +; the keys work on any Stream Deck.
- **Spotify Premium.** Spotify's Web API only allows playback control on Premium accounts.
- A free Spotify developer app (takes about a minute, see below)

## Installation

### From a release

Download the latest `.streamDeckPlugin` from [Releases](https://github.com/Protomothis/spotify-deck-plus/releases) and double-click it.

### From source

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build
npm run link
```

Restart the Stream Deck app once so it picks up the linked plugin.

## Setup

1. Add the **Settings** key to your deck and press it, or open <http://127.0.0.1:8888>.
2. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), click **Create app**.
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (must match exactly)
   - **APIs used:** Web API
3. Copy the app's **Client ID** into the settings page and click **Log in**.

That's it. The settings page shows your account, what's playing, and a re-login prompt if a new version needs extra permissions.

> [!NOTE]
> New Spotify apps start in _Development mode_, which is fine for personal use. To let other Spotify accounts use your Client ID, add them under **User Management** in the dashboard.

## How it works

- **Authentication** uses OAuth Authorization Code with PKCE, so no client secret is needed. Tokens are stored in `~/.config/spotify-deck-plus/tokens.json` with `0600` permissions and refreshed automatically.
- **Settings server.** A small HTTP server listens on `127.0.0.1:8888` only. It serves the settings page and receives the OAuth callback. It rejects requests addressed to any other host, as well as cross-origin writes.
- **State.** One shared poller reads `/me/player` every 2 seconds, and only while an action is visible. Every key and dial renders from that same state.
- **Device activation.** When Spotify reports _no active device_, the plugin does the following:
  1. Opens Spotify in the background if it isn't running (`open -g -a Spotify`).
  2. Waits for this Mac to appear among your Spotify Connect devices.
  3. Transfers playback to it and retries the command.

  If the app is running but has dropped off Connect, the plugin wakes it with AppleScript. The first time this happens, macOS asks you to allow Stream Deck to control Spotify.

## Development

```bash
npm run watch      # rebuild on change and restart the plugin
npm run typecheck  # tsc --noEmit
npm run validate   # validate the manifest with the Stream Deck CLI
npm run pack       # build a .streamDeckPlugin into dist/
```

Plugin logs are written to `com.protomothis.spotify-deck-plus.sdPlugin/logs/`.

```
src/
├── plugin.ts            entry point, registers actions
├── i18n.ts              en / ko / ja strings
├── render.ts            key images, icons, marquee text
├── server.ts            settings page and OAuth callback
├── pi.ts                property inspector messages
├── spotify/
│   ├── auth.ts          PKCE login, token storage and refresh
│   ├── api.ts           Web API client and device activation
│   └── store.ts         shared player state poller
└── actions/
    ├── base.ts          shared rendering, spinner, marquee
    ├── keys.ts          key actions
    ├── dials.ts         playback, volume and list dials
    └── explorer.ts      library browser dial
```

## Limitations

- macOS only. Device activation relies on `open`, `pgrep` and AppleScript.
- Spotify's Web API doesn't expose playlist folders, so playlists are shown as a flat list.
- Podcasts play, but browsing is focused on music.

## Contributing

Bug reports and ideas are welcome in [Issues](https://github.com/Protomothis/spotify-deck-plus/issues). Pull requests go to the `develop` branch. See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch model and release steps.

## Disclaimer

This is an independent project. It is not affiliated with, endorsed by, or sponsored by Spotify AB or Elgato (Corsair). Spotify is a trademark of Spotify AB. Stream Deck is a trademark of Corsair Memory, Inc.

## License

[MIT](LICENSE) © Protomothis
