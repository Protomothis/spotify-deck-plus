<div align="center">

# Spotify Deck+

**Elgato Stream Deck + のために作った Spotify コントローラー**

ダイヤルひとつでライブラリ全体をたどり、タッチストリップでアルバムアートを眺めて、<br>
Spotify が起動していなくても、そのまま再生を押すだけ。

[![Latest release](https://img.shields.io/github/v/release/Protomothis/spotify-deck-plus?label=download&color=1ed760)](https://github.com/Protomothis/spotify-deck-plus/releases/latest)
![macOS | Windows](https://img.shields.io/badge/macOS%2012%2B%20%7C%20Windows%2010%2B-lightgrey)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-7.1%2B-blue)
[![CI](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[English](README.md) · [한국어](README.ko.md) · **日本語**

</div>

---

## 特長

|                                   |                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🗂️ **ダイヤルでライブラリを探索** | _再生中_ から上の階層へ戻り、プレイリスト・お気に入り・アーティスト・アルバムをフォルダのように開いて、選んだ曲をそのまま再生。長押しでキューに追加。 |
| ⚡ **押すだけで再生**             | アクティブなデバイスがなければ、このコンピューターの Spotify を起動して再生デバイスにし、押した操作を続けて実行します。                               |
| 🎨 **タッチストリップ**           | アルバムアートの背景、リアルタイムの進行バー、カバーのサムネイル。長いタイトルはゆっくりスクロールします。                                            |
| 🎛️ **すばやい反応**               | 音量とシークは即座に反応し、リクエストは裏でまとめて送ります。ステップ幅も変更できます。                                                              |
| 🌐 **English · 한국어 · 日本語**  | Stream Deck の言語に合わせて表示します。                                                                                                              |
| 🔒 **プライバシー重視**           | _自分の_ Spotify アプリでログインし、トークンはコンピューターの外に出ません。                                                                         |

## クイックスタート

1. [最新リリース](https://github.com/Protomothis/spotify-deck-plus/releases/latest)から `com.protomothis.spotify-deck-plus.streamDeckPlugin` を**ダウンロード**し、ダブルクリックします。
2. Stream Deck アプリで **Spotify Deck+** カテゴリを開き、使いたいアクションをデッキにドラッグします。**設定** キーも置いておきましょう。
3. **設定** キーを押すか <http://127.0.0.1:8888> を開き、案内に従って Spotify を接続します。2分ほどで終わります。[手順は下で説明しています](#spotify-を接続する)。
4. 音楽を再生しましょう。🎶

> **必要なもの:** macOS 12 以降または Windows 10 以降、Spotify デスクトップアプリ、Stream Deck アプリ 7.1 以降、**Spotify Premium**。ダイヤルには Stream Deck + が必要で、キーはどの Stream Deck でも使えます。

## 操作方法

### キー

| キー                   | 押すと                                         |
| ---------------------- | ---------------------------------------------- |
| **再生 / 一時停止**    | 再生・一時停止。アルバムアートを表示します。   |
| **前の曲 / 次の曲**    | 曲の移動                                       |
| **お気に入り**         | お気に入りの曲に追加/削除                      |
| **シャッフル**         | シャッフルのオン/オフ                          |
| **リピート**           | オフ → 全曲 → 1曲                              |
| **プレイリストに追加** | キー設定で選んだプレイリストに再生中の曲を追加 |
| **デバイス切替**       | 次の Spotify Connect デバイスへ再生を移す      |
| **設定**               | 設定ページを開く                               |

### ダイヤル

| ダイヤル               | 回す                 | 押す                                   | タッチストリップ                |
| ---------------------- | -------------------- | -------------------------------------- | ------------------------------- |
| **再生コントロール**   | シーク (5秒、変更可) | 再生 / 一時停止                        | タップ: 次の曲 · 長押し: 前の曲 |
| **音量**               | 音量 (2%、変更可)    | ミュート / 解除                        | ミュート / 解除                 |
| **ライブラリブラウザ** | スクロール           | 開く / 再生 · **長押し: キューに追加** | タップ: 戻る · 長押し: 再生中へ |
| **マイプレイリスト**   | スクロール           | プレイリストを再生                     | タップ: 再生中へ · 長押し: 更新 |
| **お気に入りの曲**     | スクロール           | 曲を再生                               | タップ: 再生中へ · 長押し: 更新 |

**ライブラリブラウザ** の構成:

```
ライブラリ
├── ▶ 再生中              再生中の曲に追従
├── ≡ 次に再生            押すとその曲までスキップ
├── ♫ マイプレイリスト  ›  プレイリスト  ›  ▶ すべて再生 · 曲…
├── ♥ お気に入りの曲
├── 👤 アーティスト     ›  アーティスト  ›  ▶ アーティストを再生 · 人気曲 › · アルバム ›
├── ◉ 保存したアルバム  ›  アルバム      ›  ▶ アルバムを再生 · 曲…
└── 🕘 最近再生した曲
```

## Spotify を接続する

Spotify では、自分で登録したデベロッパーアプリを通してのみ再生操作ができます。無料で、2分ほどで終わります。

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) で **Create app** をクリックします。
2. 名前と説明は自由に入力し、次の2つを設定します。
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (完全に一致させてください)
   - **Which API/SDKs are you planning to use?** Web API
3. アプリの **Settings** から **Client ID** をコピーして Spotify Deck+ の設定ページに貼り付け、**ログイン** をクリックします。

<details>
<summary><b>なぜ自分の Spotify アプリが必要なの?</b></summary>

<br>

2026年から、Spotify は _開発モード_ のアプリを最大5ユーザーに制限し、オーナーに Premium を求めています。より広い利用権限は、ユーザー数の多い登録事業者にしか与えられません。そのため、ひとつのアプリをみんなで共有することはできず、各自が自分のアプリを使います。自分のログインが他人のアプリを経由しない、という利点もあります。

デベロッパーアプリを作ったアカウントとは**別の Spotify アカウント**でログインする場合は、ダッシュボードの **User Management** にそのアカウントを追加してください。

</details>

## 設定

- **シーク・音量のステップ:** Stream Deck アプリで再生コントロールまたは音量ダイヤルを選ぶと、シーク幅 (1〜30秒) と音量ステップ (1〜10%) を選べます。
- **プレイリストに追加:** キーを選んで追加先のプレイリストを指定します。
- **アカウント:** 設定ページ (<http://127.0.0.1:8888>) で接続状態と再生中の曲を確認し、ログアウトできます。

## トラブルシューティング

<details>
<summary><b>「アクティブなデバイスなし」</b></summary>

このコンピューターの Spotify を自動で起動し、再生デバイスに切り替えます。それでも動かない場合は、Spotify アプリで一度再生するか、**デバイス切替** キーを押してください。

</details>

<details>
<summary><b>macOS が「Stream Deck が Spotify を操作しようとしています」と確認してくる (macOS)</b></summary>

**許可** をクリックしてください。Spotify が Spotify Connect の一覧から外れたときに、再び起こすために使います。拒否した場合は **システム設定 › プライバシーとセキュリティ › オートメーション › Stream Deck › Spotify** でオンに戻せます。

</details>

<details>
<summary><b>ログイン時に「INVALID_CLIENT」や Redirect URI のエラーが出る</b></summary>

Spotify アプリの Redirect URI が `http://127.0.0.1:8888/callback` と完全に一致しているか確認してください。`localhost` ではなく `127.0.0.1` を使い、末尾に `/` を付けないでください。確認したらアプリを保存します。

</details>

<details>
<summary><b>「Premium が必要」</b></summary>

Spotify の再生操作は Premium アカウントでのみ利用できます。

</details>

<details>
<summary><b>「権限が必要 · 設定ページで再ログイン」</b></summary>

新しいバージョンで Spotify の権限が追加されました。設定ページで **再ログイン** をクリックしてください。

</details>

<details>
<summary><b>設定キーに「ポート 8888 使用中」と表示される</b></summary>

ほかのアプリがポート 8888 を使っています。そのアプリを終了し、Stream Deck アプリを再起動してください。

</details>

## アップデートと削除

- **アップデート:** [Releases](https://github.com/Protomothis/spotify-deck-plus/releases) から新しい `.streamDeckPlugin` をダウンロードしてダブルクリックします。配置したキーと設定はそのまま残ります。
- **削除:** Stream Deck アプリ (**設定 › プラグイン**) でプラグインを削除します。ログイン情報も消すには `~/.config/spotify-deck-plus` フォルダ (Windows では `%USERPROFILE%\.config\spotify-deck-plus`) を削除してください。

## プライバシー

- 自分の Client ID で OAuth PKCE ログインを行うので、client secret は不要です。トークンは `~/.config/spotify-deck-plus/tokens.json` に本人だけが読める形で保存され、自動で更新されます。
- プラグインは Spotify とだけ通信します。設定サーバーは `127.0.0.1:8888` でのみ待ち受け、ほかのホスト宛てのリクエストや別サイトからの書き込みは拒否します。

## ソースからビルド

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build && npm run link   # その後 Stream Deck アプリを再起動
```

開発の流れは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。バグ報告やアイデアは [Issues](https://github.com/Protomothis/spotify-deck-plus/issues) へどうぞ。

## 制限事項

- **Windows** 対応は追加されたばかりです。CI ではテストしていますが、実機ではまだ十分に検証されていません。問題があれば [Issues](https://github.com/Protomothis/spotify-deck-plus/issues) で教えてください。Windows では Spotify は完全なバックグラウンドではなく最小化された状態で起動し、Spotify Connect から外れたアプリを自動で起こす機能はありません。
- Spotify Web API はプレイリストのフォルダを提供していないため、プレイリストはフォルダなしの一覧で表示されます。

## 免責事項

Spotify Deck+ は独立したプロジェクトであり、Spotify AB や Elgato (Corsair) とは関係がなく、承認や後援も受けていません。Spotify は Spotify AB の商標です。Stream Deck は Corsair Memory, Inc. の商標です。

## ライセンス

[MIT](LICENSE) © Protomothis
