import React, { Component } from 'react';
import { connect } from 'react-redux';
// import axios from 'axios';
import electron, { ipcRenderer } from 'electron';
import recorder from '../recorder';
import initAudio from '../audio';
import { store } from '../index';
import { addOutputThunk } from '../store/decoder.js';
import dictionary from '../utils/dictionary';

const RECORD_TIME = 2500;

/*eslint-disable class-methods-use-this*/
class Mic extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioContext: null,
      recorder: null
    };
    this.stopRecording = this.stopRecording.bind(this);
    this.blobify = this.blobify.bind(this);
    this.registerRecordShortcut = this.registerRecordShortcut.bind(this);
  }

  blobify(blob, snippets, user) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      let base64data = reader.result.split(',')[1];
      let userUrls = [
        {command: 'github',
          code: user.githubURL},
        {command: 'waffle',
          code: user.waffleURL},
        {command: 'stackoverflow',
        code: user.stackoverflowURL}
      ];
      snippets = snippets.concat(userUrls);
      store.dispatch(addOutputThunk(base64data, snippets, dictionary));
    };
  }

  stopRecording(snippets, user) {
    // console.log(recorder)
    this.state.recorder.exportMonoWAV(blob => {
      console.log(blob);
      this.blobify(blob, snippets, user);
    });
    this.state.recorder.stop();
    this.state.recorder.clear();
  }

  // parseCommand(input) {
  //   const words = input.split(' ');
  //   const parsed = words.map(word => {
  //     if (dictionary[word]) return `▵${word}▵`;
  //     else return word;
  //   });
  //   return parsed;
  // }

  registerRecordShortcut(props) {
    this.state.recorder.record();
    ipcRenderer.send('startRecording');
    setTimeout(() => {
      this.stopRecording(props.allSnippets, props.user);
      ipcRenderer.send('stopRecording');
    }, RECORD_TIME);
  }

  componentDidMount() {
    // this is essential for re-registering the command
    electron.remote.globalShortcut.unregisterAll();
    const componProps = this.props;
    initAudio().then(_recorder => {
      this.setState({ recorder: _recorder }, () => {
        return electron.remote.globalShortcut.register('Alt+z', () => {
          this.registerRecordShortcut(componProps);
        });
      });
    });
  }

  render() {
    // console.log('DICTIONARY / MIC', dictionary, this.props.user)
    return <div />;
  }
}

const mapProps = state => ({
  allSnippets: state.allSnippets,
  commands: state.commands,
  user: state.user
});

export default connect(mapProps)(Mic);

/*
    const parsedCommands = this.props.commands.map(this.parseCommand);
    return (
      <div>
        {parsedCommands.map(command => (
          <h3 key={command.join(' ')}> {command.join(' ')} </h3>
        ))}
      </div>
    );
*/
