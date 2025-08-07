# 코드 비교 앱 (Code Diff App)

Electron 기반의 데스크탑 코드 비교 어플리케이션입니다. 두 개의 텍스트/코드 파일을 업로드하면 변경된 부분을 명확하게 확인할 수 있도록 시각적으로 비교합니다.

## 🚀 주요 기능

- **파일 업로드**: 드래그앤드롭 또는 파일 선택으로 두 파일 업로드
- **코드 비교**: 라인/단어/문자 단위 비교 지원
- **시각적 표시**: 추가(초록), 삭제(빨강), 수정(파랑) 색상 구분
- **구문 강조**: JavaScript, HTML, CSS 등 다양한 언어 지원
- **줄 번호**: 선택적 줄 번호 표시
- **테마**: 라이트/다크 테마 지원
- **결과 저장**: 비교 결과를 파일로 저장
- **오프라인 사용**: 인터넷 연결 없이도 사용 가능

## 🛠️ 기술 스택

- **Electron**: 데스크탑 애플리케이션 프레임워크
- **React**: 사용자 인터페이스 라이브러리
- **diff**: 코드 비교 라이브러리
- **react-syntax-highlighter**: 코드 구문 강조
- **styled-components**: CSS-in-JS 스타일링
- **react-dropzone**: 드래그앤드롭 파일 업로드

## 📦 설치 및 실행

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run electron-dev
```

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# Electron 앱 실행
npm run electron
```

### 배포용 실행 파일 생성

#### 윈도우용 실행 파일 생성
```bash
# 윈도우용 실행 파일 생성 (NSIS 설치 프로그램 + 포터블 버전)
npm run build:win
```

#### 맥용 실행 파일 생성
```bash
# 맥용 실행 파일 생성 (DMG + ZIP)
npm run build:mac
```

#### 모든 플랫폼용 실행 파일 생성
```bash
# 모든 플랫폼용 실행 파일 생성 (윈도우, 맥, 리눅스)
npm run build:all
```

#### 기본 빌드 (현재 플랫폼용)
```bash
# 현재 플랫폼에 맞는 실행 파일 생성
npm run dist
```

### 빌드 결과물

빌드가 완료되면 `release` 폴더에 다음 파일들이 생성됩니다:

**윈도우:**
- `CodeDiffApp Setup 1.0.0.exe` - 설치 프로그램
- `CodeDiffApp 1.0.0.exe` - 포터블 실행 파일

**맥:**
- `CodeDiffApp.dmg` - DMG 설치 파일
- `CodeDiffApp.zip` - ZIP 압축 파일

**리눅스:**
- `CodeDiffApp.AppImage` - AppImage 실행 파일

## 🎯 사용법

1. **파일 업로드**: 두 개의 파일을 드래그앤드롭하거나 "파일 선택" 버튼을 클릭하여 업로드
2. **비교 모드 선택**: 라인, 단어, 문자 단위 비교 중 선택
3. **결과 확인**: 변경된 부분이 색상으로 구분되어 표시
4. **결과 저장**: "차이점 저장" 버튼을 클릭하여 결과를 파일로 저장

## ⚙️ 설정

- **테마**: 라이트/다크 테마 선택
- **비교 모드**: 라인/단어/문자 단위 비교
- **줄 번호**: 줄 번호 표시 여부
- **구문 강조**: 코드 구문 강조 표시 여부

## 📁 지원 파일 형식

- 텍스트 파일 (.txt)
- 프로그래밍 언어: JavaScript (.js, .jsx), TypeScript (.ts, .tsx), HTML (.html), CSS (.css), JSON (.json)
- 마크다운 (.md)
- 기타 언어: Python (.py), Java (.java), C++ (.cpp), C (.c), PHP (.php), Ruby (.rb), Go (.go), Rust (.rs), Swift (.swift), Kotlin (.kt)

## 🔧 개발

### 프로젝트 구조

```
code-diff-app/
├── public/
│   ├── electron.js          # Electron 메인 프로세스
│   └── index.html           # HTML 템플릿
├── src/
│   ├── components/
│   │   ├── FileUpload.js    # 파일 업로드 컴포넌트
│   │   ├── DiffViewer.js    # 코드 비교 뷰어
│   │   └── Settings.js      # 설정 컴포넌트
│   ├── App.js               # 메인 앱 컴포넌트
│   └── index.js             # React 진입점
├── package.json             # 프로젝트 설정
└── README.md               # 프로젝트 문서
```

### 주요 컴포넌트

- **FileUpload**: 드래그앤드롭 파일 업로드 및 파일 선택
- **DiffViewer**: 코드 비교 및 시각화
- **Settings**: 앱 설정 관리

## 📝 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해 주세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 통해 문의해 주세요.
