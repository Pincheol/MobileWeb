# MobileWeb
모바일 앱 개발 최종과제 코드

### -src/App.js
TO-DO List의 메인 컴포넌트. &nbsp; 
주요 기능으로는
1. 투두 리스트 관리 (AsyncStorage를 사용하여 데이터 저장)
2. 캘린더 뷰 기능 (react-native-calendars 라이브러리를 사용)
3. expo-av를 통해 음성을 녹음하고 Node.js 서버로 전송
4. 음성 녹음을 위한 모달 작성

### -src/images.js
아이콘 파일을 관리하기 위한 컴포넌트.

### -src/theme.js
앱의 테마를 정의한 컴포넌트.

### -src/components/BackColor.js
앱의 테마를 전환하는 컴포넌트.
 &nbsp; themeMode와 toggleTheme을 props로 받아 현재 테마 모드에 따라 버튼의 텍스트와 동작을 결정.

### -src/components/IconButton.js
아이콘 버튼을 구현한 컴포넌트.

### -src/components/input.js
사용자 입력을 위한 텍스트 입력 컴포넌트.

### -src/components/Task.js
투두 리스트의 작성된 리스트를 표시하고 관리하는 컴포넌트. &nbsp; 
주요 기능으로는
1. 체크 버튼
   -completed 값에 따라 아이콘과 스타일링 변경
2. 수정 버튼
   -수정 완료 시 updateTask로 전달하여 수정
3. 삭제 버튼
   -deleteTask 함수를 호출하여 삭제
4. 수정 입력
   -포커스를 잃거나 완료버튼을 누르면 수정 종료
   
### -Backend/index.js
Node.js 기반의 Express 서버 코드. &nbsp; 
주요 기능으로는 
1. FFmpeg를 사용하여 음성파일(.3gp, .caf)을 .wav파일로 변환
2. Multer을 이용한 음성 파일 업로드 처리
3. Google STT(Speech-to-text) API 호출
4. 변환된 음성 파일을 텍스트로 반환 등이 있음.
