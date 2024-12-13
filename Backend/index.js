require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// 시스템에 설치된 ffmpeg 사용
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3000;

// Google Cloud Speech 클라이언트 설정
const client = new SpeechClient();

// Multer를 사용하여 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

// uploads 폴더가 없으면 생성
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(bodyParser.json());

// 서버 확인을 위한 기본 엔드포인트
app.get('/', (req, res) => {
  res.send('ToDo-List Backend Server is Running!');
});

// ffmpeg를 사용해 오디오 파일(.3gp, .caf 등)을 .wav로 변환
const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log('입력 파일 경로:', inputPath);
    console.log('출력 파일 경로:', outputPath);

    ffmpeg(inputPath)
      .setFfmpegPath(ffmpegPath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('ffmpeg 명령어 실행:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('진행 상황:', progress);
      })
      .on('end', () => {
        console.log('파일 변환 완료:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('파일 변환 실패:', err);
        reject(err);
      })
      .run();
  });
};

// 음성 파일을 업로드하고 STT로 변환하는 엔드포인트
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    console.log('오디오 파일 수신:', req.file);

    // 업로드된 파일 경로 가져오기
    const audioFilePath = path.join(__dirname, req.file.path);
    const wavFilePath = path.join(__dirname, 'uploads', `${req.file.filename}.wav`);

    // 지원되는 파일 형식 확인 및 변환
    const supportedFormats = ['.3gp', '.caf'];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (!supportedFormats.includes(fileExtension)) {
      throw new Error(`지원되지 않는 파일 형식입니다: ${fileExtension}`);
    }

    // .caf 또는 .3gp 파일을 .wav 파일로 변환
    await convertToWav(audioFilePath, wavFilePath);

    // 변환된 파일의 크기 확인 (품질 문제 확인을 위해)
    const wavFileInfo = fs.statSync(wavFilePath);
    console.log('변환된 파일 크기:', wavFileInfo.size);

    if (wavFileInfo.size === 0) {
      throw new Error('변환된 .wav 파일의 크기가 0입니다. 파일 변환에 문제가 발생했습니다.');
    }

    // 변환된 파일이 존재하는지 확인
    if (fs.existsSync(wavFilePath)) {
      console.log('변환된 파일이 성공적으로 저장되었습니다:', wavFilePath);
    } else {
      throw new Error('변환된 파일이 저장되지 않았습니다.');
    }

    // Google Cloud Speech-to-Text 요청 구성
    const audio = {
      content: fs.readFileSync(wavFilePath).toString('base64'),
    };

    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'ko-KR',
    };

    const request = {
      audio: audio,
      config: config,
    };

    // Google Speech-to-Text API 호출
    const [response] = await client.recognize(request);
    console.log('API 응답:', JSON.stringify(response, null, 2));

    if (!response || response.results.length === 0) {
      console.log('오디오에서 텍스트를 추출할 수 없습니다.');
      res.send({ transcription: '변환된 텍스트 없음' });
    } else {
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join('\n');
      console.log('변환된 텍스트:', transcription);
      res.send({ transcription });
    }

    // 업로드된 파일 삭제
    try {
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
      if (fs.existsSync(wavFilePath)) {
        //fs.unlinkSync(wavFilePath);
      }
    } catch (deleteError) {
      console.error('파일 삭제 실패:', deleteError);
    }
  } catch (error) {
    console.error('STT 변환 실패:', error);
    res.status(500).send('STT 변환에 실패했습니다.');
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행되고 있습니다.`);
});
