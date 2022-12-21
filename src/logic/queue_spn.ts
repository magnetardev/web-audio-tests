import { CHANNEL_COUNT, bindUI, playButton, writeWhiteNoiseToChannel, initalizeSpnContext } from "./util";
import { RingBuffer, QUEUE_SIZE, FRAME_SIZE } from "./util/queue/sync";

let audioContext: AudioContext;
let gainNode: GainNode;
let sourceNode: AudioBufferSourceNode;
let scriptNode: ScriptProcessorNode;
let queue: RingBuffer;
let samplesBuffer: Float32Array;
let outputs: Float32Array[];


function handleAudioProcess(event: AudioProcessingEvent) {
	let outputBuffer = event.outputBuffer;
	for (let i = 0, length = outputs.length; i < length; i++) {
		outputs[i] = outputBuffer.getChannelData(i);
	}
	queue.dequeue(outputs);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		let context = initalizeSpnContext();
		audioContext = context.audioContext;
		gainNode = context.gainNode;
		sourceNode = context.sourceNode;
		scriptNode = context.scriptNode;
		samplesBuffer = new Float32Array(FRAME_SIZE);
		queue = new RingBuffer(QUEUE_SIZE, CHANNEL_COUNT);
		bindUI(audioContext, gainNode);
		outputs = new Array(2);

		scriptNode.addEventListener("audioprocess", handleAudioProcess);
		sourceNode.start();
	}
	requestAnimationFrame(generateSamplesLoop);
	return audioContext.resume();
});

function generateSamplesLoop() {
	for (let i = 0; i < CHANNEL_COUNT; i++) {
		writeWhiteNoiseToChannel(samplesBuffer);
		queue.enqueue(samplesBuffer);
	}
	requestAnimationFrame(generateSamplesLoop);
}
