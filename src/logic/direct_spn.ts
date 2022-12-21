import { bindUI, playButton, writeWhiteNoiseToBuffer, initalizeSpnContext } from "./util";

let audioContext: AudioContext;
let gainNode: GainNode;
let sourceNode: AudioBufferSourceNode;
let scriptNode: ScriptProcessorNode;

function handleAudioProcess(event: AudioProcessingEvent) {
	writeWhiteNoiseToBuffer(event.outputBuffer);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		let context = initalizeSpnContext();
		audioContext = context.audioContext;
		gainNode = context.gainNode;
		sourceNode = context.sourceNode;
		scriptNode = context.scriptNode;

		bindUI(audioContext, gainNode);

		scriptNode.addEventListener("audioprocess", handleAudioProcess);
		sourceNode.start();
	}
	return audioContext.resume();
});
