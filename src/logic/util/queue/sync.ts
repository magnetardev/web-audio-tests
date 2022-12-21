import { enqueue as commonEnqueue, dequeue as commonDequeue, clear as commonClear } from "./common";
export { KERNEL_LENGTH, RENDER_QUANTUM, FRAME_SIZE, QUEUE_SIZE } from "./common";

export class RingBuffer {
	buffer: Float32Array;
	bufferLength: number;
	channelCount: number;
	read = 0;
	write = 0;

	private setRead: (value: number) => void;
	private setWrite: (value: number) => void;

	constructor(size: number, channelCount = 2) {
		const underlyingBuffer = new SharedArrayBuffer(size * Float32Array.BYTES_PER_ELEMENT * channelCount);
		const buffer = new Float32Array(underlyingBuffer);
		this.buffer = buffer;
		this.bufferLength = buffer.length;
		this.channelCount = channelCount;
		this.setRead = (value) => this.read = value;
		this.setWrite = (value) => this.write = value;
	}

	enqueue(input: Float32Array): boolean {
		return commonEnqueue(
			input,
			this.buffer,
			this.bufferLength,
			input.length,
			this.read,
			this.write,
			this.setWrite,
		);
	}

	dequeue(channels: Float32Array[]): boolean {
		return commonDequeue(
			channels,
			this.buffer,
			this.bufferLength,
			this.channelCount,
			this.read,
			this.write,
			this.setRead,
		);
	}

	clear() {
		commonClear(this.buffer, this.setRead, this.setWrite);
	}
}
