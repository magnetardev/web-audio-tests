import { CHANNEL_COUNT, bindUI, playButton, writeWhiteNoiseToChannel, initializeWorkletContext } from "./util";
import { FRAME_SIZE } from "./util/queue/sync";
import workletUrl from "./worklets/queue.ts?worker&url";

let audioContext: AudioContext;
let gainNode: GainNode;
let workletNode: AudioWorkletNode;
let samplesBuffer = new Float32Array(FRAME_SIZE);

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		let context = await initializeWorkletContext(workletUrl, "ring-audio-worklet");
		audioContext = context.audioContext;
		gainNode = context.gainNode;
		workletNode = context.workletNode;
		bindUI(audioContext, gainNode);
	}
	requestAnimationFrame(generateSamplesLoop);
	return audioContext.resume();
});

function generateSamplesLoop() {
	for (let i = 0; i < CHANNEL_COUNT; i++) {
		writeWhiteNoiseToChannel(samplesBuffer);
		workletNode.port.postMessage(samplesBuffer);
	}
	requestAnimationFrame(generateSamplesLoop);
}
