import React, { useState, useEffect, useRef } from 'react';
import {
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Button,
} from 'react-native';
import styled, { ThemeProvider } from 'styled-components/native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme,lightTheme,darkTheme } from './theme';
import Task from './components/Task';
import BackColor from './components/BackColor';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.background};
  align-items: center;
  justify-content: flex-start;
  color: ${({ theme }) => theme.text};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
`;


const Title = styled.Text`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const YearSelector = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 10px 0;
`;

const YearButton = styled.TouchableOpacity`
  padding: 10px;
  background-color: ${({ theme }) => theme.main};
  margin: 0 10px;
  border-radius: 5px;
`;

const YearText = styled.Text`
  font-size: 20px;
  color: ${({ theme }) => theme.text};
`;

const CurrentDate = styled.TouchableOpacity`
  margin-bottom: 10px;
`;

const CurrentDateText = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.text};
`;

const List = styled.ScrollView`
  flex: 1;
  width: ${({ width }) => width - 40}px;
  margin-top: 10px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: ${({ width }) => width - 40}px;
  padding: 10px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.2);
`;

const StyledTextInput = styled.TextInput`
  flex: 1;
  padding: 10px;
  border-width: 1px;
  border-color: gray;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;


const MicButton = styled.TouchableOpacity`
  margin-left: 10px;
  background-color: ${({ theme }) => theme.main};
  padding: 10px;
  border-radius: 50px;
`;

const MicButtonText = styled.Text`
  color: white;
  font-size: 16px;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  align-items: center;
  width: 80%;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const RecordingTime = styled.Text`
  font-size: 16px;
  margin-bottom: 20px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  margin-top: 20px;
`;

export default function App() {
  const width = Dimensions.get('window').width;

  const [isReady, setIsReady] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecordingModalVisible, setIsRecordingModalVisible] = useState(false);
  const [intervalId, setIntervalId] = useState(null); // intervalId 상태 추가
  const recordingTimeRef = useRef(0);  // 상태를 useRef로 관리
  const [themeMode, setThemeMode] = useState('dark'); // 테마
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태

  useEffect(() => {
    const loadResources = async () => {
      await _loadTasks();
      setIsReady(true);
    };
    loadResources();
  }, []);

  const _saveTasks = async (tasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      setTasks(tasks);
    } catch (e) {
      console.error(e);
    }
  };

  const _loadTasks = async () => {
    const loadedTasks = await AsyncStorage.getItem('tasks');
    setTasks(JSON.parse(loadedTasks || '{}'));
  };

  const _addTask = () => {
    if (newTask.trim().length > 0) {
      const ID = Date.now().toString();
      const newTaskObject = {
        [ID]: { id: ID, text: newTask.trim(), date: selectedDate, completed: false },
      };
      setNewTask('');
      _saveTasks({ ...tasks, ...newTaskObject });
    }
  };

  const _deleteTask = (id) => {
    const updatedTasks = { ...tasks };
    delete updatedTasks[id];
    _saveTasks(updatedTasks);
  };

  const _onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const _onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const changeYear = (increment) => {
    setSelectedYear((prevYear) => prevYear + increment);
  };

  const markedDates = Object.values(tasks).reduce((acc, task) => {
    acc[task.date] = { marked: true, dotColor: 'blue' };
    return acc;
  }, {});

  const setupAudio = async () => {
    try {
      // 마이크 권한 요청
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('마이크 권한이 필요합니다.');
        return;
      }

      // 오디오 모드 설정 (iOS에서 녹음 허용)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, // 녹음 허용
        playsInSilentModeIOS: true, // 무음 모드에서도 오디오 허용
        staysActiveInBackground: true, // 백그라운드에서도 오디오 활성화
      });
    } catch (err) {
      console.error('오디오 설정 실패:', err);
    }
  };

 const startRecording = async () => {
   try {
     await setupAudio(); // 오디오 권한과 설정

     // 녹음 상태 초기화
     setRecordingTime(0);  // 녹음 시간을 0으로 초기화
     recordingTimeRef.current = 0;  // useRef로 관리되는 녹음 시간 초기화

     // 이전 녹음이 있다면 녹음 종료
     if (recording) {
       await recording.stopAndUnloadAsync();  // 이전 녹음이 있을 경우 정리
     }

     // 타이머 초기화
     if (intervalId) {
       clearInterval(intervalId);  // 이전 타이머가 있다면 정지
     }

     const recordingInstance = new Audio.Recording();
     await recordingInstance.prepareToRecordAsync({
       isMeteringEnabled: true,
       android: {
         extension: '.3gp',
         outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
         audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
         sampleRate: 44100,
         numberOfChannels: 2,
         bitRate: 128000,
       },
       ios: {
         extension: '.caf',
         outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
         audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
         sampleRate: 44100,
         numberOfChannels: 2,
         bitRate: 128000,
         linearPCMBitDepth: 16,
         linearPCMIsBigEndian: false,
         linearPCMIsFloat: false,
       },
     });

     await recordingInstance.startAsync();
     setRecording(recordingInstance);
     setIsRecording(true);

     // 타이머 시작
     const id = setInterval(() => {
       recordingTimeRef.current += 1;  // 타이머 증가
       setRecordingTime(recordingTimeRef.current);  // 상태 업데이트
     }, 1000);  // 1초마다 업데이트
     setIntervalId(id);
   } catch (err) {
     console.error('녹음 시작 실패:', err);
   }
 };
  
  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setIsRecording(false);
        clearInterval(intervalId);  // 타이머 정지
  
        // STT 요청
        await sendAudioToServer(uri);
      }
    } catch (err) {
      console.error('녹음 중단 실패:', err);
    }
  };

  const sendAudioToServer = async (uri) => {
    const formData = new FormData();

    // 파일 확장자 추출
    const fileExtension = uri.split('.').pop();

    // MIME 타입 매핑
    const mimeTypes = {
        '3gp': 'audio/3gp',
        'caf': 'audio/x-caf',
    };

    // 파일 확장자에 따른 MIME 타입 설정
    const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

    formData.append('audio', {
        uri,
        name: `audio.${fileExtension}`,
        type: mimeType,
    });

    try {
        const response = await axios.post('http://10.107.0.237:3000/upload-audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000, // 타임아웃을 10초로 설정
        });
        console.log('서버 응답:', response.data);
        const transcription = response.data.transcription;
        setNewTask(transcription); // STT 결과를 텍스트 입력 칸에 추가
        setIsRecordingModalVisible(false);
    } catch (err) {
        console.error('STT 요청 실패:', err);
        console.log('오디오 URI:', uri);
        console.log('보낸 FormData:', JSON.stringify(Object.fromEntries(formData), null, 2)); // FormData 출력
    }
};

  const closeModal = () => {
    setIsRecording(false);
    setIsRecordingModalVisible(false);
    clearInterval(intervalId);  // 타이머 정지
    setRecordingTime(0);  // 녹음 시간 초기화
  };

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: 'red',
  };

  if (!isReady) return null;

  const openRecordingModal = () => {
    // 녹음 시간을 초기화
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  
    // 모달 열기
    setIsRecordingModalVisible(true);
  };

   // 테마 변경 함수
    const toggleTheme = () => {
      setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const filteredTasks = Object.values(tasks).filter(
      task =>
        new Date(task.date).getFullYear() === selectedYear &&
        task.text.toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
          <Container>
            <Header>
              <Title>TODO List</Title>

              <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}>
                <Text style={{ color: themeMode === 'dark' ? 'white' : 'black', fontSize: 16 }}>
                  {viewMode === 'list' ? 'Calendar View' : 'List View'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleTheme}>
                <Text style={{ color: themeMode === 'dark' ? 'white' : 'black', fontSize: 16 }}>
                  {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </TouchableOpacity>
            </Header>

            {viewMode === 'list' ? (
              <>
                <YearSelector>
                  <YearButton onPress={() => changeYear(-1)}>
                    <YearText>◀</YearText>
                  </YearButton>
                  <YearText>{selectedYear}년</YearText>
                  <YearButton onPress={() => changeYear(1)}>
                    <YearText>▶</YearText>
                  </YearButton>
                </YearSelector>

                <InputContainer width={width}>
                  <StyledTextInput
                    placeholder="Search Tasks"
                    placeholderTextColor="gray"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </InputContainer>


                 <List width={width}>
                      {(searchQuery
                        ? filteredTasks // 검색어가 있을 때 필터링된 결과
                        : Object.values(tasks).filter(
                            task => new Date(task.date).getFullYear() === selectedYear
                          ) // 검색어가 없으면 기존 리스트
                      )
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // 최신순 정렬
                        .map(item => (
                          <Task
                            key={item.id}
                            item={item}
                            deleteTask={() => _deleteTask(item.id)}
                            toggleTask={() => {}}
                            updateTask={() => {}}
                          />
                        ))}
                    </List>


                <CurrentDate onPress={() => setShowDatePicker(true)}>
                  <CurrentDateText>현재 날짜: {selectedDate}</CurrentDateText>
                </CurrentDate>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(selectedDate)}
                    mode="date"
                    display="default"
                    onChange={_onDateChange}
                  />
                )}

                <InputContainer width={width}>
                  <StyledTextInput
                    placeholder="+ Add a Task"
                    placeholderTextColor="gray"
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={_addTask}
                  />
                <MicButton onPress={openRecordingModal}>
                    <MicButtonText>🎤</MicButtonText>
                  </MicButton>
                </InputContainer>

                {/* 음성 녹음 모달 */}
                <Modal
                  visible={isRecordingModalVisible}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setIsRecordingModalVisible(false)}
                >
                  <ModalContainer>
                    <ModalContent>
                      <ModalTitle>음성 녹음</ModalTitle>
                      <Ionicons name="mic" size={48} color="red" />
                      <RecordingTime>녹음 시간: {recordingTime}초</RecordingTime>
                      <ButtonRow>
                        <Button title="닫기" onPress={closeModal} />
                        <Button
                          title={isRecording ? '녹음 완료' : '녹음 시작'}
                          onPress={isRecording ? stopRecording : startRecording}
                        />
                      </ButtonRow>
                    </ModalContent>
                  </ModalContainer>
                </Modal>
              </>
            ) : (
              <>
                <Calendar
                markedDates={markedDates}
                onDayPress={_onDayPress}
                theme={{
                  arrowColor: 'white',
                  todayTextColor: 'red',
                  dayTextColor: 'black',
                  textDisabledColor: 'gray',
                  selectedDayBackgroundColor: 'blue',
                  selectedDayTextColor: 'white',
                }}
              />

              <List width={width}>
                {Object.values(tasks)
                  .filter(task => task.date === selectedDate)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))  // 최신 날짜가 위로 오게 정렬
                  .map(item => (
                    <Task
                      key={item.id}
                      item={item}
                      deleteTask={() => _deleteTask(item.id)}
                      toggleTask={() => {}}
                      updateTask={() => {}}
                    />
                  ))}
              </List>

              <InputContainer width={width}>
                <StyledTextInput
                  placeholder="+ Add a Task"
                  placeholderTextColor="gray"
                  value={newTask}
                  onChangeText={setNewTask}
                  onSubmitEditing={_addTask}
                />
                <MicButton onPress={openRecordingModal}>
                  <MicButtonText>🎤</MicButtonText>
                </MicButton>
              </InputContainer>

              {/* 음성 녹음 모달 */}
              <Modal
                visible={isRecordingModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsRecordingModalVisible(false)}
              >
                <ModalContainer>
                  <ModalContent>
                    <ModalTitle>음성 녹음</ModalTitle>
                    <Ionicons name="mic" size={48} color="red" />
                    <RecordingTime>녹음 시간: {recordingTime}초</RecordingTime>
                    <ButtonRow>
                      <Button title="닫기" onPress={closeModal} />
                      <Button
                        title={isRecording ? '녹음 완료' : '녹음 시작'}
                        onPress={isRecording ? stopRecording : startRecording}
                      />
                    </ButtonRow>
                  </ModalContent>
                </ModalContainer>
              </Modal>
            </>
          )}
        </Container>
      </ThemeProvider>
    );
    }