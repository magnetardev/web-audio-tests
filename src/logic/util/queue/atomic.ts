import { enqueue as commonEnqueue, dequeue as commonDequeue, clear as commonClear } from "./common";
export { KERNEL_LENGTH, RENDER_QUANTUM, FRAME_SIZE, QUEUE_SIZE } from "./common";

export interface AtomicRingBuffer {
	fields: Uint32Array;
	buffer: Float32Array;
	bufferLength: number;
	channelCount: number;
}

type SetterStore = WeakMap<AtomicRingBuffer["fields"], (value: number) => number>;

const setReadStore: SetterStore = new WeakMap();
const setWriteStore: SetterStore = new WeakMap();

const READ_OFFSET = 0;
const WRITE_OFFSET = 1;
const FIELDS_LENGTH = 2;

/** Creates the state object that is safe to be transferred between threads */
export function createRingBuffer(size: number, channelCount = 2): AtomicRingBuffer {
	const fieldsLength = FIELDS_LENGTH * Uint32Array.BYTES_PER_ELEMENT;
	const bufferLength = size * Float32Array.BYTES_PER_ELEMENT * channelCount;

	const underlyingBuffer = new SharedArrayBuffer(fieldsLength + bufferLength);
	const buffer = new Float32Array(underlyingBuffer, fieldsLength);
	return {
		fields: new Uint32Array(underlyingBuffer, 0, fieldsLength),
		buffer,
		bufferLength: buffer.length,
		channelCount,
	};
}

function getSetter(store: SetterStore, fields: AtomicRingBuffer["fields"], field: typeof READ_OFFSET | typeof WRITE_OFFSET) {
	let setter = store.get(fields);
	if (!setter) {
		setter = (value: number) => Atomics.store(fields, field, value);
		store.set(fields, setter);
	}
	return setter;
}

/**
 * Write bytes into the buffer.
 *`state` is equivalent to `this`, but by structuring the code this way its easier to code split
 *
 * input is the bytes to write, though is expected to be formatted as: 
 * [channel_a, channel_b, channel_a, channel_b, ...] 
 */
export function enqueue(state: AtomicRingBuffer, input: Float32Array): boolean {
	// put state fields into variables to save on object lookups 
	const fields = state.fields;
	const buffer = state.buffer;
	const bufferLength = state.bufferLength;
	const desiredLength = input.length;

	// load read and write indexes
	const read = Atomics.load(fields, READ_OFFSET);
	const write = Atomics.load(fields, WRITE_OFFSET);

	return commonEnqueue(
		input, 
		buffer, 
		bufferLength,
		desiredLength,
		read,
		write,
		getSetter(setWriteStore, fields, WRITE_OFFSET),
	);
}

/** 
 * Read bytes from the buffers into the given channels.
 * `state` is equivalent to `this`, but by structuring the code this way its easier to code split
 *
 * channels is an array of output channels to write to. They are expected to be equal.
 */
export function dequeue(state: AtomicRingBuffer, channels: Float32Array[]): boolean {
	// set state to variables to save on lookups
	const fields = state.fields;
	const buffer = state.buffer;
	const bufferLength = state.bufferLength;
	const channelCount = state.channelCount;

	// load read and write indexes
	const read = Atomics.load(fields, READ_OFFSET);
	const write = Atomics.load(fields, WRITE_OFFSET);

	return commonDequeue(
		channels,
		buffer,
		bufferLength,
		channelCount,
		read,
		write,
		getSetter(setReadStore, fields, READ_OFFSET),
	);
}

/** clear the data in the state and reset it */
export function clear(state: AtomicRingBuffer) {
	const fields = state.fields;
	commonClear(
		state.buffer, 
		getSetter(setReadStore, fields, READ_OFFSET),
		getSetter(setWriteStore, fields, WRITE_OFFSET),
   );
}
