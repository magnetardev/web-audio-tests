import { bindUI, playButton, writeWhiteNoiseToChannel } from "../util";
import { AtomicRingBuffer, createRingBuffer, enqueue } from "../util/atomic_queue";
import { initalizeContext } from "./_shared";
import workerURL from "./worklets/queue_atomic.ts?worker&url";

const CHANNEL_COUNT = 2;
const MYSTERY_FACTOR = 20;
const FRAME_SIZE = MYSTERY_FACTOR * 128;

let audioContext: AudioContext;
let gainNode: GainNode;
let buffer: AtomicRingBuffer;
let samples = new Float32Array(FRAME_SIZE * 2 * 12);

async function init() {
	buffer = createRingBuffer(4096 * CHANNEL_COUNT * MYSTERY_FACTOR, CHANNEL_COUNT);
	let context = await initalizeContext(
		workerURL,
		"atomic-ring-audio-worklet",
		{ buffer },
	);
	audioContext = context.audioContext;
	gainNode = context.gainNode;

	bindUI(audioContext, gainNode);
	requestAnimationFrame(runLoop);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		await init();
	}
	return audioContext.resume();
});

function runLoop() {
	for (let i = 0, writeIters = 2; i < writeIters; i++) {
		writeWhiteNoiseToChannel(samples);
		enqueue(buffer, samples);
	}
	requestAnimationFrame(runLoop);
}

