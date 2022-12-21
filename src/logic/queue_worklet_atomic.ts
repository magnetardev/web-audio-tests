import { CHANNEL_COUNT, bindUI, playButton, writeWhiteNoiseToChannel, initializeWorkletContext } from "./util";
import { createRingBuffer, enqueue, QUEUE_SIZE, FRAME_SIZE } from "./util/queue/atomic";
import workerUrl from "./worklets/queue_atomic.ts?worker&url";

let audioContext: AudioContext;
let gainNode: GainNode;
let buffer = createRingBuffer(QUEUE_SIZE, CHANNEL_COUNT);
let samples = new Float32Array(FRAME_SIZE);

playButton.addEventListener("click", async function() {
	if (!audioContext) {
		let context = await initializeWorkletContext(workerUrl, "atomic-ring-audio-worklet", { 
			buffer
		});
		audioContext = context.audioContext;
		gainNode = context.gainNode;

		bindUI(audioContext, gainNode);
		requestAnimationFrame(generateSamplesLoop);
	}
	return audioContext.resume();
});

function generateSamplesLoop() {
	for (let i = 0; i < CHANNEL_COUNT; i++) {
		writeWhiteNoiseToChannel(samples);
		enqueue(buffer, samples);
	}
	requestAnimationFrame(generateSamplesLoop);
}

