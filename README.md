# D SMART ERP v2.0 · Enterprise redesign

기존 업무 로직을 보존한 SAP·더존 스타일 기업용 화면 리디자인입니다.

## 실행

프로젝트 폴더에서 다음을 실행한 뒤 http://127.0.0.1:8080 을 여세요.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

별도 앱 빌드나 npm 설치는 필요하지 않습니다. index.html 직접 열기도 가능하지만, 데이터 저장 origin이 일정한 로컬 서버 실행을 권장합니다. 기존 데이터는 기존 시스템관리에서 JSON 백업 후 새 화면의 시스템관리에서 복원하세요. 다른 브라우저·포트·주소의 localStorage는 자동으로 공유되지 않습니다.

## 검증 재실행 (선택)

Node.js 24.15 이상(24.x), 22.22.2 이상(22.x) 또는 26 이상이 필요합니다. 개발 테스트에만 jsdom을 사용합니다.

```sh
npm install
npm test
```

결과는 qa/regression-rerun.json에 생성됩니다. 테스트는 메모리 DOM의 별도 저장소에서 실행되어 실제 브라우저 데이터를 수정하지 않습니다. 원본 비교는 원본을 별도 폴더에 풀고 ORIGINAL_ROOT에 그 경로를 지정해 `node tests/regression.cjs --baseline`으로 실행할 수 있습니다.

## 포함 자료

- docs/ANALYSIS-AND-TESTS.ko.md: 구조·업무·데이터·변경점·검증·원본 제약 분석
- qa/: 원본/수정본 자동 테스트 및 브라우저 메뉴 테스트 결과, 파일 해시
- tests/regression.cjs: 24개 회귀 시나리오
- 데스크톱 및 모바일 미리보기 이미지는 별도로 제공한 전체 프로젝트 ZIP에 포함되어 있습니다.

원본 erp-01.js~erp-11.js, 저장 키/데이터 구조, 기존 시연 기능을 유지했습니다. 대시보드 중복 DOM은 렌더러 호환을 위해 숨김 컨테이너에 보존되어 있습니다. 날짜 제한과 일부 고정 예시는 원본 그대로입니다. GitHub 반영 대상은 `ODH-dev/D-SMART-ERP`의 `v2-development-from-main` 브랜치이며, main 브랜치는 변경 대상에서 제외합니다.
