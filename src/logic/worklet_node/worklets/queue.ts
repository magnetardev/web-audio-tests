import { RingBuffer } from "../../util/queue";

class SyncProcessor extends AudioWorkletProcessor {
	buffer: RingBuffer;

	constructor(options: AudioWorkletNodeOptions) {
		super(options);
		let buffer = new RingBuffer(441000, 2);
		this.buffer = buffer;
		this.port.onmessage = this.handleMessage.bind(this);
	}

	handleMessage(evt: MessageEvent<Float32Array>) {
		this.buffer.enqueue(evt.data);
	}

	process(_: Float32Array[][], outputs: Float32Array[][]) {
		this.buffer.dequeue(outputs[0]);
		return true;
	}
}

registerProcessor("ring-audio-worklet", SyncProcessor);
