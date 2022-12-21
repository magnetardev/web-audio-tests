import type { AtomicRingBuffer } from "../util/queue/atomic";
import { dequeue } from "../util/queue/atomic";

class AtomicRingProcessor extends AudioWorkletProcessor {
	buffer: AtomicRingBuffer;
	dequeue: (output: Float32Array[]) => boolean;

	constructor(options: AudioWorkletNodeOptions) {
		super();
		this.buffer = options.processorOptions.buffer;
		this.dequeue = dequeue.bind(this, this.buffer);
	}

	process(_: Float32Array[][], outputs: Float32Array[][]) {
		this.dequeue(outputs[0]);
		return true;
	}
}

registerProcessor("atomic-ring-audio-worklet", AtomicRingProcessor);

