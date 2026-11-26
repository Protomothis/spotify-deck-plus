<div align="center">

# Spotify Deck+

**Elgato Stream Deck + 를 위해 만든 Spotify 컨트롤러**

다이얼 하나로 라이브러리 전체를 탐색하고, 터치 스트립에서 앨범 아트를 보고,<br>
Spotify 가 꺼져 있어도 그냥 재생을 누르세요.

[![Latest release](https://img.shields.io/github/v/release/Protomothis/spotify-deck-plus?label=download&color=1ed760)](https://github.com/Protomothis/spotify-deck-plus/releases/latest)
![macOS | Windows](https://img.shields.io/badge/macOS%2012%2B%20%7C%20Windows%2010%2B-lightgrey)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-7.1%2B-blue)
[![CI](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/Protomothis/spotify-deck-plus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[English](README.md) · **한국어** · [日本語](README.ja.md)

</div>

---

## 이런 점이 좋아요

|                                  |                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 🗂️ **다이얼로 라이브러리 탐색**  | _지금 재생 중_ 에서 상위로 나가 재생목록·좋아요·아티스트·앨범을 폴더처럼 들어가고, 고른 곡을 바로 재생해요. 길게 누르면 대기열에 추가돼요. |
| ⚡ **그냥 재생 누르기**          | 재생 중인 기기가 없으면 이 컴퓨터의 Spotify 를 열어 재생 기기로 잡고, 누른 동작을 이어서 실행해요.                                         |
| 🎨 **터치 스트립**               | 앨범 아트 배경, 실시간 진행 바, 커버 썸네일. 긴 제목은 천천히 흘러가요.                                                                    |
| 🎛️ **빠른 반응**                 | 볼륨과 탐색이 즉시 반응하고, 요청은 뒤에서 묶어서 보내요. 단위도 바꿀 수 있어요.                                                           |
| 🌐 **English · 한국어 · 日本語** | Stream Deck 언어를 따라가요.                                                                                                               |
| 🔒 **개인정보 보호**             | _내_ Spotify 앱으로 로그인하고, 토큰은 내 컴퓨터 밖으로 나가지 않아요.                                                                     |

## 빠른 시작

1. [최신 릴리스](https://github.com/Protomothis/spotify-deck-plus/releases/latest)에서 `com.protomothis.spotify-deck-plus.streamDeckPlugin` 을 **내려받아** 더블클릭하세요.
2. Stream Deck 앱에서 **Spotify Deck+** 카테고리를 열고 원하는 액션을 덱에 끌어다 놓으세요. **설정** 키도 하나 놓아 두세요.
3. **설정** 키를 누르거나 <http://127.0.0.1:8888> 을 열고 안내대로 Spotify 를 연결하세요. 2분 정도 걸려요. [자세한 방법은 아래](#spotify-연결)에 있어요.
4. 음악을 트세요. 🎶

> **필요한 것:** macOS 12 이상 또는 Windows 10 이상, Spotify 데스크톱 앱, Stream Deck 앱 7.1 이상, **Spotify Premium**. 다이얼은 Stream Deck + 가 있어야 하고, 키는 모든 Stream Deck 에서 동작해요.

## 조작법

### 키

| 키                    | 누르면                                   |
| --------------------- | ---------------------------------------- |
| **재생 / 일시정지**   | 재생·일시정지. 앨범 아트를 보여 줘요.    |
| **이전 곡 / 다음 곡** | 곡 이동                                  |
| **좋아요**            | 좋아요 표시한 곡에 추가/제거             |
| **셔플**              | 셔플 켜기/끄기                           |
| **반복**              | 끔 → 전체 → 한 곡                        |
| **재생목록에 추가**   | 키 설정에서 고른 재생목록에 현재 곡 추가 |
| **재생 기기 전환**    | 다음 Spotify Connect 기기로 재생 옮기기  |
| **설정**              | 설정 페이지 열기                         |

### 다이얼

| 다이얼               | 돌리기                | 누르기                                | 터치 스트립                       |
| -------------------- | --------------------- | ------------------------------------- | --------------------------------- |
| **재생 제어**        | 탐색 (5초, 변경 가능) | 재생 / 일시정지                       | 탭: 다음 곡 · 길게: 이전 곡       |
| **볼륨**             | 볼륨 (2%, 변경 가능)  | 음소거 / 해제                         | 음소거 / 해제                     |
| **라이브러리 탐색**  | 스크롤                | 열기 / 재생 · **길게: 대기열에 추가** | 탭: 뒤로 · 길게: 지금 재생 중     |
| **내 재생목록**      | 스크롤                | 재생목록 재생                         | 탭: 재생 중인 곳 · 길게: 새로고침 |
| **좋아요 표시한 곡** | 스크롤                | 곡 재생                               | 탭: 재생 중인 곳 · 길게: 새로고침 |

**라이브러리 탐색** 다이얼의 구조:

```
라이브러리
├── ▶ 지금 재생 중       재생 중인 곡을 따라감
├── ≡ 다음 재생 대기열   누르면 그 곡까지 건너뜀
├── ♫ 내 재생목록    ›   재생목록  ›  ▶ 전체 재생 · 곡…
├── ♥ 좋아요 표시한 곡
├── 👤 아티스트      ›   아티스트  ›  ▶ 아티스트 재생 · 인기곡 › · 앨범 ›
├── ◉ 저장한 앨범    ›   앨범      ›  ▶ 앨범 전체 재생 · 곡…
└── 🕘 최근 재생
```

## Spotify 연결

Spotify 는 직접 등록한 개발자 앱을 통해서만 재생 제어를 허용해요. 무료이고 2분이면 돼요.

1. [Spotify 개발자 대시보드](https://developer.spotify.com/dashboard)에서 **Create app** 을 누르세요.
2. 이름과 설명은 아무거나 넣고, 아래 두 가지를 설정하세요.
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (정확히 일치해야 해요)
   - **Which API/SDKs are you planning to use?** Web API
3. 앱의 **Settings** 에서 **Client ID** 를 복사해 Spotify Deck+ 설정 페이지에 붙여넣고 **로그인** 을 누르세요.

<details>
<summary><b>왜 내 Spotify 앱이 필요한가요?</b></summary>

<br>

2026년부터 Spotify 는 _개발 모드_ 앱을 사용자 5명까지만 허용하고, 앱 주인이 Premium 이어야 해요. 더 넓은 사용 권한은 사용자가 많은 등록 사업자에게만 줘요. 그래서 앱 하나를 여러 사람이 같이 쓸 수 없고, 각자 자기 앱을 만들어 써요. 덕분에 내 로그인이 다른 사람의 앱을 거치지 않는다는 장점도 있어요.

개발자 앱을 만든 계정과 **다른 Spotify 계정**으로 로그인하려면, 대시보드의 **User Management** 에 그 계정을 추가하세요.

</details>

## 설정

- **탐색·볼륨 단위:** Stream Deck 앱에서 재생 제어나 볼륨 다이얼을 선택하면, 탐색 간격(1~30초)과 볼륨 단위(1~10%)를 고를 수 있어요.
- **재생목록에 추가:** 키를 선택해 대상 재생목록을 고르세요.
- **계정:** 설정 페이지(<http://127.0.0.1:8888>)에서 연결 상태와 재생 중인 곡을 보고 로그아웃할 수 있어요.

## 문제 해결

<details>
<summary><b>"활성 기기 없음"</b></summary>

이 컴퓨터의 Spotify 를 자동으로 열고 재생 기기로 잡아요. 그래도 안 되면 Spotify 앱에서 한 번 재생하거나 **재생 기기 전환** 키를 눌러 보세요.

</details>

<details>
<summary><b>macOS 가 "Stream Deck 이 Spotify 를 제어하려고 합니다" 라고 물어봐요 (macOS)</b></summary>

**허용** 을 누르세요. Spotify 가 Spotify Connect 목록에서 빠졌을 때 다시 깨우는 데 써요. 거부했다면 **시스템 설정 › 개인정보 보호 및 보안 › 자동화 › Stream Deck › Spotify** 에서 다시 켤 수 있어요.

</details>

<details>
<summary><b>로그인할 때 "INVALID_CLIENT" 나 Redirect URI 오류가 나요</b></summary>

Spotify 앱의 Redirect URI 가 정확히 `http://127.0.0.1:8888/callback` 인지 확인하세요. `localhost` 가 아니라 `127.0.0.1` 이어야 하고, 끝에 `/` 가 없어야 해요. 확인한 뒤 앱을 저장하세요.

</details>

<details>
<summary><b>"Premium 필요"</b></summary>

Spotify 는 Premium 계정에서만 재생 제어를 허용해요.

</details>

<details>
<summary><b>"권한 필요 · 설정 페이지에서 다시 로그인"</b></summary>

새 버전에 Spotify 권한이 추가됐어요. 설정 페이지에서 **다시 로그인** 을 누르세요.

</details>

<details>
<summary><b>설정 키에 "포트 8888 사용 중" 이 떠요</b></summary>

다른 앱이 8888 포트를 쓰고 있어요. 그 앱을 종료한 뒤 Stream Deck 앱을 재시작하세요.

</details>

## 업데이트와 삭제

- **업데이트:** [Releases](https://github.com/Protomothis/spotify-deck-plus/releases) 에서 새 `.streamDeckPlugin` 을 받아 더블클릭하세요. 배치한 키와 설정은 그대로 유지돼요.
- **삭제:** Stream Deck 앱(**설정 › 플러그인**)에서 플러그인을 지우세요. 로그인 정보까지 지우려면 `~/.config/spotify-deck-plus` 폴더(Windows 는 `%USERPROFILE%\.config\spotify-deck-plus`)도 삭제하세요.

## 개인정보

- 내 Client ID 로 OAuth PKCE 로그인을 해서 client secret 이 필요 없어요. 토큰은 `~/.config/spotify-deck-plus/tokens.json` 에 나만 읽을 수 있게 저장되고 자동으로 갱신돼요.
- 플러그인은 Spotify 하고만 통신해요. 설정 서버는 `127.0.0.1:8888` 에서만 열리고, 다른 호스트로 오는 요청과 다른 사이트에서 오는 쓰기 요청은 거부해요.

## 소스에서 빌드

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build && npm run link   # 그다음 Stream Deck 앱 재시작
```

개발 방법은 [CONTRIBUTING.md](CONTRIBUTING.md) 를 보세요. 버그 제보와 아이디어는 [Issues](https://github.com/Protomothis/spotify-deck-plus/issues) 에 남겨 주세요.

## 제한 사항

- **Windows** 지원은 새로 추가됐어요. CI 에서는 검사하지만 실제 PC 에서는 아직 충분히 테스트되지 않았어요. 문제가 있으면 [이슈](https://github.com/Protomothis/spotify-deck-plus/issues)로 알려 주세요. Windows 에서는 Spotify 가 완전히 백그라운드가 아니라 최소화된 채로 열리고, Spotify Connect 에서 빠진 앱을 자동으로 깨우는 기능은 없어요.
- Spotify Web API 가 재생목록 폴더를 제공하지 않아서, 재생목록은 폴더 없이 한 목록으로 보여요.

## 고지

Spotify Deck+ 는 독립적으로 만든 프로젝트로, Spotify AB 나 Elgato(Corsair)와 관련이 없고 그들의 보증이나 후원을 받지 않았어요. Spotify 는 Spotify AB 의 상표이고, Stream Deck 은 Corsair Memory, Inc. 의 상표예요.

## 라이선스

[MIT](LICENSE) © Protomothis
