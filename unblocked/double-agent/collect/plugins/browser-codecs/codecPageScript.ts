import * as csv from 'csv-parse/lib/sync';
import { readFileSync } from 'fs';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';

export default function codecPageScript(ctx: IRequestContext) {
  return `
<script type="text/javascript">
  const videoMimes = ${JSON.stringify(videoMimes)};
  const audioMimes = ${JSON.stringify(audioMimes)};
  const codecs = ${JSON.stringify(codecs)};
</script>
<script type="text/javascript">
(function browserCodecProbe() {
  const videoSupport = {
    recordingFormats: [],
    probablyPlays: [],
    maybePlays: []
  };
  const audioSupport = {
    recordingFormats: [],
    probablyPlays: [],
    maybePlays: []
  };

  let webRtcAudioCodecs = [];
  let webRtcVideoCodecs = [];
  
  function testCodecs() {
    const videoElt = document.createElement('video');
    const audioElt = document.createElement('audio');
    if (window["RTCRtpSender"] && RTCRtpSender.getCapabilities) {
      webRtcAudioCodecs = RTCRtpSender.getCapabilities("audio").codecs || [];
      webRtcVideoCodecs = RTCRtpSender.getCapabilities("video").codecs || [];
    }
    for (const format of audioMimes) {
      {
        const isTypeAllowed = window["MediaRecorder"] && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format);
        if (isTypeAllowed) audioSupport.recordingFormats.push(format);
        const canPlay = audioElt.canPlayType(format);
        if (canPlay === 'probably') audioSupport.probablyPlays.push(format);
        if (canPlay === 'maybe') audioSupport.maybePlays.push(format);
          
      }
  
      for (const codec of codecs) {
        const formatPlusCodec= format + ';codecs=' + codec;
        const isTypeAllowed = window["MediaRecorder"] && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(formatPlusCodec);
        if (isTypeAllowed) audioSupport.recordingFormats.push(formatPlusCodec);
        const canPlay = audioElt.canPlayType(formatPlusCodec);
        if (canPlay === 'probably') audioSupport.probablyPlays.push(formatPlusCodec);
        if (canPlay === 'maybe') audioSupport.maybePlays.push(formatPlusCodec);
      }
    }
    for (const format of videoMimes) {
      {
        const isTypeAllowed = window["MediaRecorder"] && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format);
        if (isTypeAllowed) videoSupport.recordingFormats.push(format);
        const canPlay = videoElt.canPlayType(format);
        if (canPlay === 'probably') videoSupport.probablyPlays.push(format);
        if (canPlay === 'maybe') videoSupport.maybePlays.push(format);
          
      }
  
      for (const codec of codecs) {
        const formatPlusCodec= format + ';codecs=' + codec;
        const isTypeAllowed = window["MediaRecorder"] && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(formatPlusCodec);
        if (isTypeAllowed) videoSupport.recordingFormats.push(formatPlusCodec);
        const canPlay = videoElt.canPlayType(formatPlusCodec);
        if (canPlay === 'probably') videoSupport.probablyPlays.push(formatPlusCodec);
        if (canPlay === 'maybe') videoSupport.maybePlays.push(formatPlusCodec);
      }
    }
  }
  const promise = new Promise(resolve => {  
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        testCodecs();
        resolve();
      });
    } else {
      setTimeout(() => {
        testCodecs();
        resolve();
      }, 100);
    }
  }).then(() =>
    fetch('${ctx.buildUrl('/save')}', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audioSupport, videoSupport, webRtcAudioCodecs, webRtcVideoCodecs }),
    }),
  );
  window.pageQueue.push(promise);
})();
</script>`;
}

const audioMimeAlternatives = csv(readFileSync(`${__dirname}/assets/mime/audio-mimetypes.csv`, 'utf8'))
  .slice(1)
  .map(x => x[1].toLowerCase())
  .filter(Boolean);

const videoMimeAlternatives = csv(readFileSync(`${__dirname}/assets/mime/video-mimetypes.csv`, 'utf8'))
  .slice(1)
  .map(x => x[1].toLowerCase())
  .filter(Boolean);

const applicationMimeAlternatives = csv(
  readFileSync(`${__dirname}/assets/mime/application-mimetypes.csv`, 'utf8'),
)
  .slice(1)
  .map(x => x[1].toLowerCase())
  .filter(Boolean);

const audioMimes = [
  ...new Set([
    'audio/flac',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/x-m4a',
    'audio/alac',
    'audio/amr-wb',
    'audio/amr-mb',
    'application/x-mpegurl',
    'audio/mpeg',
    ...audioMimeAlternatives,
    ...applicationMimeAlternatives,
  ]),
];

const videoMimes = [
  ...new Set([
    'video/mp4',
    'video/ogg',
    'video/quicktime',
    'video/3gpp',
    'video/3gp2',
    'video/webm',
    'video/x-m4a',
    'video/mpeg',
    'video/x-matroska',
    ...videoMimeAlternatives,
    ...applicationMimeAlternatives,
  ]),
];

const codecs = [
  'h264',
  'H264',
  'h264,vp9,opus',
  'h264,vp8,opus',
  'vp8,pcm',
  'vp8,opus',
  'vp8,vorbis',
  'vp9,pcm',
  'vp9,opus',
  'vp9,vorbis',
  'vp8',
  'vp9',
  'vp8.0',
  'vp9.0',
  'vorbis',
  'opus',
  'avc1',
  'avc1.42E01E',
  'avc1.42E01F',
  'avc1.4D401F',
  'avc1.4D4028',
  'avc1.640028',
  'avc1.640029',
  'dvhe.05.06',
  'dvhe.05.07',
  'dvhe.05.09',
  'dvhe.08.06',
  'dvhe.08.07',
  'dvhe.08.09',
  'hev1.1.6.L150.B0',
  'hev1.1.6.L153.B0',
  'hev1.2.6.L150.B0',
  'hev1.2.6.L153.B0',
  'pcm',
  '1',
  'mp3',
  'mp4a.40.2',
  'mp4a.40.5',
  'mp4a.69',
  'mp4a.6B',
  'mp4a.40.05',
  'mp4a.a5',
  'mp4a.a6',
  'ac-3',
  'ec-3',
  'mhm1.0x0D',
  'theora',
];
