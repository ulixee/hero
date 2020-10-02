const { audioCodecs, videoCodecs } = args;

emulateRecordingCodecs(audioCodecs.recordingFormats, videoCodecs.recordingFormats);

function parseCodecs(list = []) {
  return list.map(x => {
    const [mime, codecs] = x.split(';');
    if (!codecs) return mime;
    const sortedCodecs = codecs
      .replace('codecs=', '')
      .split(',')
      .filter(Boolean)
      .sort()
      .join(',');

    return `${mime};codecs=${sortedCodecs}`;
  });
}

audioCodecs.probablyPlays = parseCodecs(audioCodecs.probablyPlays);
audioCodecs.maybePlays = parseCodecs(audioCodecs.maybePlays);
videoCodecs.probablyPlays = parseCodecs(videoCodecs.probablyPlays);
videoCodecs.maybePlays = parseCodecs(videoCodecs.maybePlays);

proxyFunction(HTMLMediaElement.prototype, 'canPlayType', (func, thisArg, type) => {
  if (type === undefined || typeof type !== 'string') return nativeKey;

  const [mime, codecs] = type
    .split(';')
    .map(x => x.trim())
    .filter(Boolean);

  let parsedType = mime;
  if (codecs) {
    const codecMatch = codecs.match(/codecs\s*=\s*"?([a-zA-Z\s,\-_\d.]+)"?/);
    if (codecMatch) {
      const sortedCodecs = codecMatch[1]
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
        .sort()
        .join(',');
      parsedType = `${mime};codecs=${sortedCodecs}`;
    }
  }

  if (
    audioCodecs.probablyPlays.includes(parsedType) ||
    videoCodecs.probablyPlays.includes(parsedType)
  ) {
    return 'probably';
  }
  if (audioCodecs.maybePlays.includes(parsedType) || videoCodecs.maybePlays.includes(parsedType)) {
    return 'maybe';
  }
  // fallback to calling browser
  return nativeKey;
});

function emulateRecordingCodecs(audioRecordingCodecs, videoRecordingCodecs) {
  if (window.MediaRecorder) {
    proxyFunction(MediaRecorder, 'isTypeSupported', (func, thisArg, type) => {
      if (type === undefined) return nativeKey;
      return audioRecordingCodecs.includes(type) || videoRecordingCodecs.includes(type);
    });
  }
}
