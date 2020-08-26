const { audioCodecs, videoCodecs } = args;

emulateRecordingCodecs(audioCodecs.recordingFormats, videoCodecs.recordingFormats);

proxyFunction(HTMLMediaElement.prototype, 'canPlayType', (func, thisArg, type) => {
  if (type === undefined) return nativeKey;
  if (audioCodecs.probablyPlays.includes(type) || videoCodecs.probablyPlays.includes(type)) {
    return 'probably';
  }
  if (audioCodecs.maybePlays.includes(type) || videoCodecs.maybePlays.includes(type)) {
    return 'maybe';
  }
});

function emulateRecordingCodecs(audioRecordingCodecs, videoRecordingCodecs) {
  if (window.MediaRecorder) {
    proxyFunction(MediaRecorder, 'isTypeSupported', (func, thisArg, type) => {
      if (type === undefined) return nativeKey;
      return audioRecordingCodecs.includes(type) || videoRecordingCodecs.includes(type);
    });
  }
}
