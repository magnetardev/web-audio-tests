import { bindUI, playButton, writeWhiteNoiseToBuffer } from "../util";
import { initalizeContext } from "./_shared";

let audioContext: AudioContext;
let gainNode: GainNode;
let sourceNode: AudioBufferSourceNode;
let scriptNode: ScriptProcessorNode;

async function init() {
	let context = initalizeContext();
	audioContext = context.audioContext;
	gainNode = context.gainNode;
	sourceNode = context.sourceNode;
	scriptNode = context.scriptNode;

	bindUI(audioContext, gainNode);

	scriptNode.addEventListener("audioprocess", handleAudioProcess);
	sourceNode.start();
}

function handleAudioProcess(event: AudioProcessingEvent) {
	writeWhiteNoiseToBuffer(event.outputBuffer);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		await init();
	}
	return audioContext.resume();
});
