<div align="center">

# Spotify Deck+

**Elgato Stream Deck + 를 위한 Spotify 컨트롤**
재생 키, 부드러운 볼륨 다이얼, 그리고 터치 스트립에서 폴더처럼 들어가며 탐색하는 라이브러리 브라우저.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md)

</div>

---

## 특징

- **다이얼 하나로 라이브러리 탐색.** *지금 재생 중*에서 상위로 나가 재생목록, 좋아요 표시한 곡, 아티스트, 저장한 앨범, 대기열, 최근 재생으로 들어가고, 고른 곡부터 바로 재생해요.
- **Spotify 가 꺼져 있어도 동작.** 활성 기기가 없으면 이 맥의 Spotify 를 백그라운드로 열어 재생 기기로 잡은 뒤, 누른 명령을 이어서 실행해요.
- **살아 있는 터치 스트립.** 앨범 아트와 진행 바를 보여 주고, 긴 제목은 천천히 흘러가요.
- **빠른 반응.** 볼륨과 탐색은 화면에 바로 반영돼요. 빠르게 돌려도 마지막 값만 모아서 보내기 때문에 API 를 과하게 부르지 않아요. 처리가 오래 걸리는 동안에는 오류 대신 로딩 스피너가 돌아요.
- **한국어·영어·일본어.** Stream Deck 앱 언어를 따라가요.
- **개인정보 보호.** 내 Spotify 개발자 앱으로 로그인하고, 토큰은 내 맥에만 저장돼요. 플러그인은 Spotify 외에는 어디와도 통신하지 않아요.

## 액션

### 키

| 액션 | 기능 |
| --- | --- |
| 재생 / 일시정지 | 앨범 아트 위에 재생 상태 표시 |
| 이전 곡 / 다음 곡 | 곡 이동 |
| 좋아요 | 현재 곡을 좋아요 표시한 곡에 추가/제거 |
| 셔플 | 셔플 켜기/끄기 |
| 반복 | 끔 → 전체 → 한 곡 |
| 재생목록에 추가 | 키 설정에서 고른 재생목록에 현재 곡 추가 |
| 재생 기기 전환 | Spotify Connect 기기를 차례로 전환 |
| 설정 | 설정 페이지(로그인·상태) 열기 |

### 다이얼 (Stream Deck +)

| 다이얼 | 돌리기 | 누르기 | 터치 |
| --- | --- | --- | --- |
| 재생 제어 | 5초씩 탐색 | 재생 / 일시정지 | 탭: 다음 곡 · 길게: 이전 곡 |
| 볼륨 | ±2% | 음소거 / 해제 | 음소거 / 해제 |
| 라이브러리 탐색 | 스크롤 | 폴더 열기 / 재생 | 탭: 뒤로 · 길게: 지금 재생 중으로 |
| 내 재생목록 | 스크롤 | 재생목록 재생 | 탭: 재생 중인 목록 · 길게: 새로고침 |
| 좋아요 표시한 곡 | 스크롤 | 곡 재생 | 탭: 재생 중인 곡 · 길게: 새로고침 |

```
라이브러리
├── 지금 재생 중        (재생 중인 곡을 따라감)
├── 다음 재생 대기열    (누르면 그 곡까지 건너뜀)
├── 내 재생목록  ›  재생목록  ›  ▶ 전체 재생 / 곡 목록
├── 좋아요 표시한 곡
├── 아티스트     ›  아티스트  ›  ▶ 아티스트 재생 / 인기곡 › / 앨범 ›
├── 저장한 앨범  ›  앨범      ›  ▶ 앨범 전체 재생 / 곡 목록
└── 최근 재생
```

## 요구 사항

- macOS 12 이상
- Stream Deck 앱 7.1 이상. 다이얼은 Stream Deck + 가 있어야 하고, 키는 모든 Stream Deck 에서 동작해요.
- **Spotify Premium.** Spotify Web API 의 재생 제어는 Premium 계정에서만 동작해요.
- Spotify 개발자 앱 (무료, 1분이면 만들어요)

## 설치

### 릴리스에서

[Releases](https://github.com/Protomothis/spotify-deck-plus/releases) 에서 최신 `.streamDeckPlugin` 파일을 받아 더블클릭하세요.

### 소스에서

```bash
git clone https://github.com/Protomothis/spotify-deck-plus.git
cd spotify-deck-plus
npm install
npm run build
npm run link
```

링크한 뒤 Stream Deck 앱을 한 번 재시작하세요.

## 설정

1. **설정** 키를 덱에 놓고 누르거나 <http://127.0.0.1:8888> 을 여세요.
2. [Spotify 개발자 대시보드](https://developer.spotify.com/dashboard)에서 **Create app** 을 누르세요.
   - **Redirect URI:** `http://127.0.0.1:8888/callback` (정확히 일치해야 해요)
   - **APIs used:** Web API
3. 앱의 **Client ID** 를 설정 페이지에 붙여넣고 **로그인**을 누르세요.

> [!NOTE]
> 새 Spotify 앱은 *Development mode* 로 시작하는데, 혼자 쓰기에는 충분해요. 다른 Spotify 계정도 같은 Client ID 를 쓰게 하려면 대시보드의 **User Management** 에 추가하세요.

## 동작 방식

- **로그인**은 PKCE 를 쓰는 OAuth 라서 client secret 이 필요 없어요. 토큰은 `~/.config/spotify-deck-plus/tokens.json` 에 `0600` 권한으로 저장되고 자동으로 갱신돼요.
- **설정 서버**는 `127.0.0.1:8888` 에서만 열려요. 다른 호스트로 오는 요청과 다른 출처에서 오는 쓰기 요청은 거부해요.
- **기기 자동 연결.** 재생 중인 기기가 없으면 Spotify 를 백그라운드로 열고, 이 맥이 Spotify Connect 기기 목록에 나타나면 재생을 옮긴 뒤 명령을 다시 실행해요. 앱이 켜져 있는데 Connect 에서 빠져 있으면 AppleScript 로 깨워요. 처음 한 번은 macOS 가 Stream Deck 의 Spotify 제어 허용 여부를 물어봐요.

## 개발

```bash
npm run watch      # 변경 시 빌드하고 플러그인 재시작
npm run typecheck
npm run validate
npm run pack       # dist/ 에 .streamDeckPlugin 생성
```

## 제한 사항

- macOS 전용이에요. 기기 자동 연결에 `open`, `pgrep`, AppleScript 를 써요.
- Spotify Web API 가 재생목록 폴더를 제공하지 않아서, 재생목록은 폴더 없이 한 목록으로 보여요.

## 고지

이 프로젝트는 독립적으로 만든 것으로, Spotify AB 나 Elgato(Corsair)와 관련이 없고 그들의 보증이나 후원을 받지 않았어요. Spotify 는 Spotify AB 의 상표이고, Stream Deck 은 Corsair Memory, Inc. 의 상표예요.

## 라이선스

[MIT](LICENSE) © Protomothis
