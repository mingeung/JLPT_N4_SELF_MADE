# 능이 JLPT N4

직접 만든 문제로 공부하는 JLPT N4 연습 앱. 문제는 공식 기출·시중 교재를 옮기지 않고 N4 출제 유형에 맞춰 새로 작성했다.

## 시험 구성
2020년 12월 이후 N4 기준: 언어지식(문자·어휘) 25분 28문항, 언어지식(문법)·독해 55분 29문항, 청해 35분 28문항. 점수는 언어지식·독해 120점(기준 38) + 청해 60점(기준 19), 합격 90점을 정답 비율로 어림한다.

## 구성
- `public/` — 그대로 배포하는 정적 앱 (index.html, app.js, style.css, questions.js)
- `content/*.json` — 문제 원본. 작성 규칙은 `CONTENT_SPEC.md` (원본에서는 `c[0]`이 정답)
- `tools/build.py` — 원본 검사 후 보기를 섞고 모의고사 회차를 나눠 `public/questions.js` 생성
- `tools/test_backend.mjs` — 실제 Supabase에 임시 계정을 만들어 가입·저장·격리·삭제 확인
- `supabase/` — DB 스키마와 `account` Edge Function (아이디/비밀번호 가입, 계정 삭제)

## 문제 수정 후
    python3 tools/build.py        # 검사 + public/questions.js 다시 만들기

## 로컬 실행
    cd public && python3 -m http.server 8765   # http://localhost:8765

## 저장 방식
- N3 앱([JLPT_N3_SELF_MAKE_TEST](https://github.com/mingeung/JLPT_N3_SELF_MAKE_TEST))과 같은 Supabase 프로젝트 `jlpt-n3-study`(서울)와 계정을 함께 쓴다. 문제 본문은 앱에, DB에는 사용자별 풀이 기록·저장한 문제·모의고사 결과만 둔다.
- N4 기록은 문제 id가 `n4-`로 시작하고, 모의고사 결과는 회차 번호에 10을 더해(11~) 저장해 N3 기록과 구분한다. 계정을 삭제하면 두 앱의 기록이 모두 지워진다.
- DB 스키마와 `account` 함수의 원본은 N3 저장소에 있고, 여기 `supabase/`는 같은 내용의 사본이다.
- 모든 테이블에 RLS: 자기 기록만 읽고 쓸 수 있다. 공개 키(publishable)는 앱에 들어 있어도 된다.
- 이메일 없이 아이디로 가입하므로 비밀번호 찾기는 없다.
- 풀이는 기기에 먼저 저장되고, 인터넷이 끊겨도 연결되면 다시 보낸다. 게스트로 푼 기록은 가입·로그인 시 계정으로 옮겨진다.
- Supabase 무료 플랜은 7일간 요청이 없으면 프로젝트가 일시정지된다. 대시보드에서 다시 켤 수 있다.

## 배포
정적 호스팅이면 어디든 된다. Vercel: 새 프로젝트로 이 폴더를 올리고 Output Directory를 `public`으로 둔다.

## 청해 음성
Google Cloud Text-to-Speech(Chirp 3 HD)로 미리 만든 파일(`public/audio/`)을 재생한다. 키는 `.env`의 `GOOGLE_TTS_API_KEY`(git 제외)이며 앱에는 들어가지 않는다.
대본을 고친 뒤:
    python3 tools/make_audio.py && python3 tools/build.py
바뀐 문항만 다시 합성한다. 파일이 없거나 재생에 실패하면 기기 음성으로 대신 읽는다.
