# 현장 기록장 (개인 전용 커리어 로그)

이 앱은 **본인 한 명만** 로그인해서 쓰는 비공개 웹앱입니다. 인수인계 앱과 달리
절대 공유 링크를 동료에게 보내지 마세요.

## 배포 순서 (약 20~30분)

### 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → "프로젝트 추가"
2. 프로젝트 이름은 아무거나 (예: career-log-private)
3. Google Analytics는 "사용 안 함"으로 꺼도 됩니다

### 2. 로그인 방식 켜기 (본인 계정 1개만)
1. 왼쪽 메뉴 **Authentication** → "시작하기"
2. 로그인 방법 탭에서 **이메일/비밀번호** 활성화
3. **Users** 탭 → "사용자 추가" → 본인 이메일 + 비밀번호 직접 입력해서 계정 1개 생성
   (회원가입 화면은 앱에 없습니다. 오직 여기서 만든 계정으로만 로그인됩니다)

### 3. 데이터베이스 켜기
1. 왼쪽 메뉴 **Firestore Database** → "데이터베이스 만들기"
2. 프로덕션 모드로 시작 (지역은 asia-northeast3 서울 추천)
3. 만들어진 후 **규칙(Rules)** 탭으로 이동해서, 이 프로젝트에 포함된
   `firestore.rules` 파일 내용을 그대로 붙여넣고 "게시" 클릭
   (본인 계정으로 로그인한 사람만 자기 데이터를 읽고 쓸 수 있게 막는 규칙입니다)

### 4. 설정값(config) 복사하기
1. 프로젝트 설정(톱니바퀴 아이콘) → 일반 탭 → 맨 아래 "내 앱" → 웹 앱 추가 (</> 아이콘)
2. 앱 이름 아무거나 입력 후 등록
3. 나오는 `firebaseConfig` 값들을 아래 6개 항목에 채워 넣을 것 — 이 값은 다음 단계에서 씁니다
   - apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId

### 5. GitHub에 코드 올리기
1. GitHub에서 새 저장소 생성 (Private으로! Public 금지)
2. 이 프로젝트 폴더의 모든 파일을 그대로 업로드
   (인수인계 앱 때처럼 GitHub 웹 화면의 "Add file → Upload files"로 폴더째 드래그하면 됩니다)
3. `.env.local` 파일은 올리지 마세요 (`.gitignore`에 이미 제외되어 있음) — 실제 키 값은 Vercel에만 넣습니다

### 6. Vercel에 배포하기
1. https://vercel.com 접속 → GitHub 계정으로 로그인
2. "Add New... → Project" → 방금 만든 저장소 선택 → Import
3. **Environment Variables**에 4단계에서 복사한 6개 값을 각각 넣기
   (이름은 `.env.local.example` 파일에 적힌 그대로: `NEXT_PUBLIC_FIREBASE_API_KEY` 등)
4. Deploy 클릭 → 몇 분 뒤 `https://프로젝트이름.vercel.app` 링크 완성

### 7. 접속 확인
1. 배포된 링크로 접속 → 로그인 화면이 뜨면 성공
2. 2단계에서 만든 본인 이메일/비밀번호로 로그인
3. 기록을 하나 남기고, Firebase 콘솔의 Firestore Database에서
   `users/본인UID` 문서에 데이터가 들어오는지 확인하면 끝

## 보안 체크리스트
- [ ] GitHub 저장소가 Private인가
- [ ] Firestore 규칙이 "로그인한 본인만" 허용하도록 게시됐는가
- [ ] Firebase Authentication에 본인 계정 1개만 있는가 (가입 경로가 없으므로 늘어날 일은 없음)
- [ ] Vercel 배포 URL을 아무에게도 공유하지 않았는가

## 로컬에서 먼저 테스트하고 싶다면
```
npm install
cp .env.local.example .env.local   # 그 다음 6개 값 채우기
npm run dev
```
