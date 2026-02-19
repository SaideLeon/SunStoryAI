
'use client';

import { StoryboardSegment } from "@/types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

export async function renderVideoFromSegments(segments: StoryboardSegment[], onProgress: (p: any) => void): Promise<Blob> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context error");

  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass({ sampleRate: 24000 });
  const audioDest = audioCtx.createMediaStreamDestination();
  const canvasStream = canvas.captureStream(30);
  const audioTracks = audioDest.stream.getAudioTracks();
  if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);

  const chunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm', videoBitsPerSecond: 5000000 });
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.start();

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment.generatedImage || !segment.audio) continue;
    onProgress({ currentSegment: i + 1, totalSegments: segments.length });
    
    const img = new Image();
    img.src = segment.generatedImage;
    await new Promise(r => img.onload = r);
    
    ctx.drawImage(img, 0, 0, width, height);
    const audioBuffer = await decodeAudioData(decodeBase64(segment.audio), audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioDest);
    source.start();
    await new Promise(r => source.onended = r as any);
  }

  mediaRecorder.stop();
  return new Promise(resolve => mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' })));
}
