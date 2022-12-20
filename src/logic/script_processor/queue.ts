import { bindUI, playButton, writeWhiteNoiseToChannel } from "../util";
import { RingBuffer } from "../util/queue";
import { initalizeContext } from "./_shared";

let audioContext: AudioContext;
let gainNode: GainNode;
let sourceNode: AudioBufferSourceNode;
let scriptNode: ScriptProcessorNode;
let queue: RingBuffer;
let samplesBuffer: Float32Array;
let outputs: Float32Array[];

async function init() {
	let context = initalizeContext();
	audioContext = context.audioContext;
	gainNode = context.gainNode;
	sourceNode = context.sourceNode;
	scriptNode = context.scriptNode;
	let bufferSize = scriptNode.bufferSize * 2;
	samplesBuffer = new Float32Array(bufferSize);
	queue = new RingBuffer(bufferSize * 2, 2);
	bindUI(audioContext, gainNode);
	outputs = new Array(2);

	scriptNode.addEventListener("audioprocess", handleAudioProcess);
	sourceNode.start();
}

function handleAudioProcess(event: AudioProcessingEvent) {
	let outputBuffer = event.outputBuffer;
	for (let i = 0, length = outputs.length; i < length; i++) {
		outputs[i] = outputBuffer.getChannelData(i);
	}
	queue.dequeue(outputs);
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
	queue.enqueue(samplesBuffer);
	writeWhiteNoiseToChannel(samplesBuffer);
	queue.enqueue(samplesBuffer);
	requestAnimationFrame(generateSamplesLoop);
}
