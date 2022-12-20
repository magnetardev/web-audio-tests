import { AtomicRingBuffer, dequeue } from "../../util/atomic_queue";

class AtomicRingProcessor extends AudioWorkletProcessor {
	buffer: AtomicRingBuffer;
	dequeue: (output: Float32Array[]) => boolean;

	constructor(options: AudioWorkletNodeOptions) {
		super(options);
		this.buffer = options.processorOptions.buffer;
		this.dequeue = dequeue.bind(this, this.buffer);
	}

	process(_: Float32Array[][], outputs: Float32Array[][]) {
		if (!this.dequeue(outputs[0])) {
			console.log("oof");
		}
		return true;
	}
}

registerProcessor("atomic-ring-audio-worklet", AtomicRingProcessor);

