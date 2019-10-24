import React from 'react'
import './App.css'
import axios from 'axios'
import {RecordRTCPromisesHandler, StereoAudioRecorder} from 'recordrtc'

const isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)

class App extends React.Component {
  constructor() {
    super()
    this.recorder = false
    this.init = this.init.bind(this)
    this.state = {
      text: ''
    }
  }

  async init() {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const recorder = new RecordRTCPromisesHandler(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder, 
        numberOfAudioChannels: isEdge ? 1 : 2
    });    
    this.recorder = recorder
  }

  async start() {
    try {
      await this.init()
      this.recorder.startRecording();
    } catch (err) {
      console.error(err)
      alert ('Voice cannot be recorded')
    } 
  }

  async stop() {
    try {
      await this.recorder.stopRecording();
      let blob = await this.recorder.getBlob();
      this.transformSpeechToText(blob)
    } catch (err) {
      console.error(err)
      alert ('Voice cannot be recognized')
    }      
  }

  transformSpeechToText(blob) {
    let formData = new FormData();
    formData.append('audio', blob, 'audio.wav')
    axios.post('/api/v1/speech_to_text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }      
    })
    .then(res => { 
      this.setState({ 
        text: res.data.text
      }) 
    })
    .catch(err => {
      console.log(err)
    }) 
  }

  transformTextToSpeech() {
    axios.post('/api/v1/text_to_speech', {
      text: this.state.text
    }).then(res => {
      this.pronounce(res.data.audio)
    })
    .catch(error => {
      console.log(error)
    })    
  }

  pronounce(base64stream) {
    var Sound = (function () {
      var df = document.createDocumentFragment();
      return function Sound(src) {
        var snd = new Audio(src);
        df.appendChild(snd); 
        snd.addEventListener('ended', function () {df.removeChild(snd);});
        snd.play();
        return snd;
      }
    }());
    var snd = Sound("data:audio/mp3;base64," + base64stream);
    snd.play()    
  }

  render() { 
    const {text} = this.state
    return (
      <div>
        <header>
          record
          <br />
          <button onClick={()=>{
            this.start()
          }}>start</button>
          <button onClick={()=>{
            this.stop()
          }}>stop</button>
          <br />
          <textarea value={text} onChange={(e)=>{this.setState({text: e.target.value})}}></textarea>
          <br />
          <button onClick={()=>{
            this.transformTextToSpeech()
          }}>pronounce</button>
        </header>
      </div>
    );
  }

}

export default App;
