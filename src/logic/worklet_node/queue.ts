import { bindUI, playButton, writeWhiteNoiseToChannel } from "../util";
import { initalizeContext } from "./_shared";
import workletURL from "./worklets/queue.ts?worker&url";

let audioContext: AudioContext;
let gainNode: GainNode;
let samplesBuffer: Float32Array;
let workletNode: AudioWorkletNode;

async function init() {
	let context = await initalizeContext(workletURL, "ring-audio-worklet");
	audioContext = context.audioContext;
	gainNode = context.gainNode;
	workletNode = context.workletNode;
	samplesBuffer = new Float32Array(4096 * 24);
	bindUI(audioContext, gainNode);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		await init();
	}
	requestAnimationFrame(generateSamplesLoop);
	return audioContext.resume();
});

function generateSamplesLoop() {
	writeWhiteNoiseToChannel(samplesBuffer);
	workletNode.port.postMessage(samplesBuffer);
	writeWhiteNoiseToChannel(samplesBuffer);
	workletNode.port.postMessage(samplesBuffer);
	requestAnimationFrame(generateSamplesLoop);
}
