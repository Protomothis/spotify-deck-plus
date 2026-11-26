<div align="center">

# Spotify Deck+

**A Spotify controller built for the Elgato Stream Deck +**

Browse your whole library from a dial, see album art on the touch strip,<br>
and press play even when Spotify isn't open.

[![Latest release](https://img.shields.io/github/v/release/Protomothis/spotify-deck-plus?label=download&color=1ed760)](https://github.com/Protomothis/spotify-deck-plus/releases/latest)
![macOS](https://img.shields.io/badge/macOS-12%2B-lightgrey)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-7.1%2B-blue)
[![CI](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**English** · [한국어](README.ko.md) · [日本語](README.ja.md)

</div>

---

## Why Spotify Deck+?

|                                  |                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🗂️ **Library on a dial**         | Go from _Now Playing_ up to your playlists, liked songs, artists and albums like folders, and play the exact track you pick. Long-press to queue it. |
| ⚡ **Just press play**           | No active device? The plugin opens Spotify on your Mac in the background, makes it the player, and carries on with what you pressed.                 |
| 🎨 **Touch strip**               | Album art backdrop, live progress, cover thumbnails, and smooth scrolling for long titles.                                                           |
| 🎛️ **Responsive controls**       | Volume and seek respond instantly and are batched behind the scenes. Steps are adjustable.                                                           |
| 🌐 **English · 한국어 · 日本語** | Follows your Stream Deck language.                                                                                                                   |
| 🔒 **Private**                   | Logs in with _your own_ Spotify app. Tokens never leave your Mac.                                                                                    |

## Quick start

1. **Download** `com.protomothis.spotify-deck-plus.streamDeckPlugin` from the [latest release](https://github.com/Protomothis/spotify-deck-plus/releases/latest) and double-click it.
2. In the Stream Deck app, open the **Spotify Deck+** category and drag the actions onto your deck. Add the **Settings** key too.
3. Press **Settings** (or open <http://127.0.0.1:8888>) and follow the steps to connect Spotify. It takes about two minutes, and [the steps are explained below](#connect-spotify).
4. Play something. 🎶

> **Requirements:** macOS 12+, Stream Deck app 7.1+, and **Spotify Premium**. The dials need a Stream Deck +; the keys work on any Stream Deck.

## Controls

### Keys

| Key                 | Press                                                      |
| ------------------- | ---------------------------------------------------------- |
| **Play / Pause**    | Play or pause. Shows the album art.                        |
| **Previous / Next** | Skip tracks                                                |
| **Like**            | Add or remove the track from Liked Songs                   |
| **Shuffle**         | Turn shuffle on or off                                     |
| **Repeat**          | Off → All → One                                            |
| **Add to Playlist** | Add the track to a playlist you choose in the key settings |
| **Switch Device**   | Move playback to your next Spotify Connect device          |
| **Settings**        | Open the settings page                                     |

### Dials

| Dial                | Rotate                   | Press                                | Touch strip                   |
| ------------------- | ------------------------ | ------------------------------------ | ----------------------------- |
| **Playback**        | Seek (5 s, adjustable)   | Play / Pause                         | Tap: next · Hold: previous    |
| **Volume**          | Volume (2 %, adjustable) | Mute / Unmute                        | Mute / Unmute                 |
| **Library Browser** | Scroll                   | Open / Play · **Hold: add to queue** | Tap: back · Hold: Now Playing |
| **My Playlists**    | Scroll                   | Play playlist                        | Tap: current · Hold: refresh  |
| **Liked Songs**     | Scroll                   | Play track                           | Tap: current · Hold: refresh  |

The **Library Browser** opens at your library:

```
Library
├── ▶ Now Playing        follows the current track
├── ≡ Up Next            your queue: pressing a track skips to it
├── ♫ My Playlists   ›   playlist  ›  ▶ Play all · tracks…
├── ♥ Liked Songs
├── 👤 Artists       ›   artist    ›  ▶ Play artist · Top tracks › · albums ›
├── ◉ Saved Albums   ›   album     ›  ▶ Play album · tracks…
└── 🕘 Recently Played
```

## Connect Spotify

Spotify only lets apps control playback through a developer app that you register yourself. It's free and takes a couple of minutes.

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and click **Create app**.
2. Fill in any name and description, then set:
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (it must match exactly)
   - **Which API/SDKs are you planning to use?** Web API
3. Open the app's **Settings**, copy the **Client ID**, paste it into the Spotify Deck+ settings page, and click **Log in**.

<details>
<summary><b>Why do I need my own Spotify app?</b></summary>

<br>

Since 2026, Spotify allows apps in _development mode_ to have at most five users, and the owner must have Premium. Wider access is only granted to registered businesses with a large user base. A single shared app can't serve everyone who installs a plugin like this one, so each person uses their own app. As a bonus, your login never goes through anyone else's app.

If you log in with a **different Spotify account** from the one that owns the developer app, add that account under **User Management** in the dashboard.

</details>

## Settings

- **Seek and volume steps:** select the Playback or Volume dial in the Stream Deck app to choose the seek step (1–30 s) or volume step (1–10 %).
- **Add to Playlist:** select the key to choose its target playlist.
- **Account:** the settings page at <http://127.0.0.1:8888> shows your connection, what's playing, and lets you log out.

## Troubleshooting

<details>
<summary><b>"No active device"</b></summary>

The plugin opens Spotify on your Mac and switches playback to it automatically. If that doesn't work, start playing something in the Spotify app once, or use the **Switch Device** key.

</details>

<details>
<summary><b>macOS asks whether Stream Deck may control Spotify</b></summary>

Click **Allow**. The plugin uses this to wake Spotify when it has dropped off Spotify Connect. If you denied it, turn it back on in **System Settings › Privacy & Security › Automation › Stream Deck › Spotify**.

</details>

<details>
<summary><b>Login fails with "INVALID_CLIENT" or a redirect URI error</b></summary>

Check that the Redirect URI in your Spotify app is exactly `http://127.0.0.1:8888/callback`. It must be `127.0.0.1`, not `localhost`, and have no trailing slash. Then save the app.

</details>

<details>
<summary><b>"Premium required"</b></summary>

Spotify only allows playback control on Premium accounts.

</details>

<details>
<summary><b>"Permission needed · log in again"</b></summary>

A newer version needs an extra Spotify permission. Open the settings page and click **Log in again**.

</details>

<details>
<summary><b>The Settings key shows "Port 8888 in use"</b></summary>

Another app is using port 8888. Quit it and restart the Stream Deck app.

</details>

## Update and uninstall

- **Update:** download the newer `.streamDeckPlugin` from [Releases](https://github.com/Protomothis/spotify-deck-plus/releases) and double-click it. Your keys and settings are kept.
- **Uninstall:** remove the plugin in the Stream Deck app (**Settings › Plugins**). Then delete `~/.config/spotify-deck-plus` to remove your login.

## Privacy

- You log in with OAuth PKCE using your own Client ID, so no client secret is needed. Tokens are stored in `~/.config/spotify-deck-plus/tokens.json` (readable only by you) and refreshed automatically.
- The plugin talks only to Spotify. Its settings server listens on `127.0.0.1:8888` only, and it rejects requests from other hosts and cross-site writes.

## Build from source

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build && npm run link   # then restart the Stream Deck app
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. Bug reports and ideas are welcome in [Issues](https://github.com/Protomothis/spotify-deck-plus/issues).

## Limitations

- macOS only.
- Spotify's Web API doesn't expose playlist folders, so playlists appear as one list.

## Disclaimer

Spotify Deck+ is an independent project. It is not affiliated with, endorsed by, or sponsored by Spotify AB or Elgato (Corsair). Spotify is a trademark of Spotify AB. Stream Deck is a trademark of Corsair Memory, Inc.

## License

[MIT](LICENSE) © Protomothis
