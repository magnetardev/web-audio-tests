import { QUEUE_SIZE, RingBuffer } from "../util/queue/sync";

class SyncRingProcessor extends AudioWorkletProcessor {
	buffer: RingBuffer;

	constructor(options: AudioWorkletNodeOptions) {
		super();
		let channelCount = options.outputChannelCount?.[0] || 2;
		let buffer = new RingBuffer(QUEUE_SIZE, channelCount);
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

registerProcessor("ring-audio-worklet", SyncRingProcessor);
