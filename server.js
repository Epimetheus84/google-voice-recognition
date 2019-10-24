const express = require('express')
const path = require('path')
const fileUpload = require('express-fileupload')

const textToSpeech = require('@google-cloud/text-to-speech')
const speech = require('@google-cloud/speech')

const app = express()

app.use(express.json())

const fileUploadConfis = {
  limits: { fileSize: 50 * 1024 * 1024 },
}

app.use(fileUpload(fileUploadConfis));

const port = 3030
const defaultLang = 'ru-RU'

const transformTextToSpeech = async (text, lang = defaultLang) => {
  const client = new textToSpeech.TextToSpeechClient();

  const voiceConfig = {
    languageCode: lang, 
    ssmlGender: 'NEUTRAL'
  }

  const request = {
    input: {text: text},
    voice: voiceConfig,
    audioConfig: {audioEncoding: 'MP3'},
  };

  const [response] = await client.synthesizeSpeech(request);
  console.log(response.audioContent)
  return response.audioContent
}

const transformSpeechToText = async (buffer, lang = defaultLang) => {
  const client = new speech.SpeechClient();

  const audioBytes = buffer.toString('base64');
  
  const audio = {
    content: audioBytes,
  };

  const config = {
    languageCode: lang,
  };
  
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request)
  console.log(response)

  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
  return transcription
}

app.get('/api/v1/', function (req, res) {
  res.sendFile(path.join(__dirname + '/client/index.html'))
})

app.post('/api/v1/text_to_speech', async (req, res) => {
  const binary = await transformTextToSpeech(req.body.text)
  const base64res = binary.toString('base64')
  res.json({audio: base64res})
})

app.post('/api/v1/speech_to_text', async (req, res) => {
  console.log(req.files)
  try {
    if(!req.files) {
      res.json({
        status: false,
        text: ''
      });
    } else {
      const audio = req.files.audio
      const transcription = await transformSpeechToText(audio.data) 
      console.log(transcription)
      res.json({
        status: true,
        text: transcription
      });
    }
  } catch (err) {
    res.status(500)
  }
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
