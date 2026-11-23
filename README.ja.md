<div align="center">

# Spotify Deck+

**Elgato Stream Deck + 向けの Spotify コントロール**
再生キー、なめらかな音量ダイヤル、そしてタッチストリップ上でフォルダのようにたどれるライブラリブラウザ。

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md)

</div>

---

## 特長

- **ダイヤルひとつでライブラリを探索。** *再生中* から上の階層へ戻り、プレイリスト、お気に入りの曲、アーティスト、保存したアルバム、キュー、再生履歴を開いて、選んだ曲からそのまま再生できます。
- **Spotify が起動していなくても動作。** アクティブなデバイスがない場合は、この Mac の Spotify をバックグラウンドで起動して再生デバイスにし、押した操作を続けて実行します。
- **動くタッチストリップ。** アルバムアートと進行バーを表示し、長いタイトルはゆっくりスクロールします。
- **すばやい反応。** 音量とシークは画面にすぐ反映されます。ダイヤルを速く回しても最後の値だけをまとめて送るので、API を呼びすぎません。処理に時間がかかるときは、エラーではなく読み込みスピナーが回ります。
- **日本語・英語・韓国語に対応。** Stream Deck アプリの言語に合わせて表示します。
- **プライバシー重視。** 自分の Spotify デベロッパーアプリでログインし、トークンは自分の Mac にだけ保存されます。プラグインは Spotify 以外とは通信しません。

## アクション

### キー

| アクション | 機能 |
| --- | --- |
| 再生 / 一時停止 | アルバムアートの上に再生状態を表示 |
| 前の曲 / 次の曲 | 曲の移動 |
| お気に入り | 再生中の曲をお気に入りに追加/削除 |
| シャッフル | シャッフルのオン/オフ |
| リピート | オフ → 全曲 → 1曲 |
| プレイリストに追加 | キー設定で選んだプレイリストに再生中の曲を追加 |
| デバイス切替 | Spotify Connect デバイスを順に切り替え |
| 設定 | 設定ページ (ログイン・状態) を開く |

### ダイヤル (Stream Deck +)

| ダイヤル | 回す | 押す | タッチ |
| --- | --- | --- | --- |
| 再生コントロール | 5秒シーク | 再生 / 一時停止 | タップ: 次の曲 · 長押し: 前の曲 |
| 音量 | ±2% | ミュート / 解除 | ミュート / 解除 |
| ライブラリブラウザ | スクロール | 開く / 再生 | タップ: 戻る · 長押し: 再生中へ |
| マイプレイリスト | スクロール | プレイリストを再生 | タップ: 再生中のリスト · 長押し: 更新 |
| お気に入りの曲 | スクロール | 曲を再生 | タップ: 再生中の曲 · 長押し: 更新 |

```
ライブラリ
├── 再生中              (再生中の曲に追従)
├── 次に再生            (押すとその曲までスキップ)
├── マイプレイリスト  ›  プレイリスト  ›  ▶ すべて再生 / 曲
├── お気に入りの曲
├── アーティスト      ›  アーティスト  ›  ▶ アーティストを再生 / 人気曲 › / アルバム ›
├── 保存したアルバム  ›  アルバム      ›  ▶ アルバムを再生 / 曲
└── 最近再生した曲
```

## 必要なもの

- macOS 12 以降
- Stream Deck アプリ 7.1 以降。ダイヤルには Stream Deck + が必要で、キーはどの Stream Deck でも使えます。
- **Spotify Premium。** Spotify Web API の再生操作は Premium アカウントでのみ動作します。
- Spotify デベロッパーアプリ (無料、1分ほどで作成できます)

## インストール

### リリースから

[Releases](https://github.com/Protomothis/spotify-deck-plus/releases) から最新の `.streamDeckPlugin` をダウンロードし、ダブルクリックしてください。

### ソースから

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build
npm run link
```

リンクしたあと、Stream Deck アプリを一度再起動してください。

## 設定

1. **設定** キーをデッキに置いて押すか、<http://127.0.0.1:8888> を開きます。
2. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) で **Create app** をクリックします。
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (完全に一致させてください)
   - **APIs used:** Web API
3. アプリの **Client ID** を設定ページに貼り付け、**ログイン** をクリックします。

> [!NOTE]
> 新しい Spotify アプリは *Development mode* で始まり、個人で使う分には十分です。ほかの Spotify アカウントにも同じ Client ID を使わせるには、ダッシュボードの **User Management** に追加してください。

## 仕組み

- **ログイン** は PKCE を使う OAuth なので、client secret は不要です。トークンは `~/.config/spotify-deck-plus/tokens.json` に `0600` 権限で保存され、自動で更新されます。
- **設定サーバー** は `127.0.0.1:8888` でのみ待ち受けます。ほかのホスト宛てのリクエストや、別オリジンからの書き込みは拒否します。
- **デバイスの自動接続。** 再生中のデバイスがない場合は Spotify をバックグラウンドで起動し、この Mac が Spotify Connect のデバイス一覧に現れたら再生を移して操作を再実行します。アプリが起動しているのに Connect から外れている場合は、AppleScript で起こします。初回だけ、macOS が Stream Deck に Spotify の操作を許可するか確認します。

## 開発

```bash
npm run watch      # 変更時にビルドしてプラグインを再起動
npm run typecheck
npm run validate
npm run pack       # dist/ に .streamDeckPlugin を作成
```

## 制限事項

- macOS 専用です。デバイスの自動接続に `open`、`pgrep`、AppleScript を使います。
- Spotify Web API はプレイリストのフォルダを提供していないため、プレイリストはフォルダなしの一覧で表示されます。

## 免責事項

これは独立したプロジェクトであり、Spotify AB や Elgato (Corsair) とは関係がなく、承認や後援も受けていません。Spotify は Spotify AB の商標です。Stream Deck は Corsair Memory, Inc. の商標です。

## ライセンス

[MIT](LICENSE) © Protomothis
