export interface AtomicRingBuffer {
	fields: Uint32Array;
	buffer: Float32Array;
	bufferLength: number;
	channelCount: number;
}

const READ_OFFSET = 0;
const WRITE_OFFSET = 1;
const FIELDS_LENGTH = 2;

/// Creates the state object that is safe to be transferred between threads
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

/// Write bytes into the buffer.
/// `state` is equivalent to `this`, but by structuring the code this way its easier to code split
///
/// input is the bytes to write, though is expected to be formatted as: 
/// [channel_a, channel_b, channel_a, channel_b, ...]
export function enqueue(state: AtomicRingBuffer, input: Float32Array): boolean {
	// put state fields into variables to save on object lookups 
	const fields = state.fields;
	const buffer = state.buffer;
	const bufferLength = state.bufferLength;
	const desiredLength = input.length;

	// load read and write indexes
	const read = Atomics.load(fields, READ_OFFSET);
	const write = Atomics.load(fields, WRITE_OFFSET);

	// determine if we can write to the buffer
	const available = (write >= read) ? bufferLength - write + read : read - write;
	if (available < desiredLength) {
		return false;
	}

	// determine whether or not we need to split the buffer into two parts
	let nextWrite = write + desiredLength;
	const needsSplit = nextWrite > bufferLength;

	// do writing based upon whether or not to split
	if (needsSplit) {
		nextWrite -= bufferLength;
		let firstHalf = buffer.subarray(write);
		let secondHalf = buffer.subarray(0, nextWrite);

		let breakpoint = firstHalf.length;
		firstHalf.set(input.subarray(0, breakpoint));
		secondHalf.set(input.subarray(breakpoint));
	} else {
		let chunk = input.subarray(0, desiredLength);
		buffer.subarray(write, nextWrite).set(chunk);
		if (nextWrite === bufferLength) {
			nextWrite = 0;
		}
	}

	// store the new write position 
	Atomics.store(fields, WRITE_OFFSET, nextWrite);
	return true;
}

/// Read bytes from the buffers into the given channels.
/// `state` is equivalent to `this`, but by structuring the code this way its easier to code split
///
/// channels is an array of output channels to write to. They are expected to be equal.
export function dequeue(state: AtomicRingBuffer, channels: Float32Array[]): boolean {
	// Get the desired length to write, if it exists
	const desiredLength = channels[0]?.length;
	if (!desiredLength) {
		return false;
	}

	// set state to variables to save on lookups
	const fields = state.fields;
	const buffer = state.buffer;
	const bufferLength = state.bufferLength;
	const channelCount = state.channelCount;

	// load read and write indexes
	const read = Atomics.load(fields, READ_OFFSET);
	const write = Atomics.load(fields, WRITE_OFFSET);

	// determine if there's enough to read
	let available = write >= read ? write - read : write + bufferLength - read;
	if (available < desiredLength) {
		return false;
	}

	// determine if the read needs to be split
	let nextRead = read + desiredLength;
	const needsSplit = nextRead > bufferLength;

	// do the reading, based on whether or not it needs to be split
	if (needsSplit) {
		nextRead -= bufferLength;
		const firstHalf = buffer.subarray(read);
		const secondHalf = buffer.subarray(0, nextRead);

		let j = 0;
		// read the first half into the channels
		for (let i = 0, length = firstHalf.length; i < length; j += channelCount) {
			for (let channel = 0; channel < channelCount; channel++, i++) {
				channels[channel][j] = firstHalf[i];
			}
		}
		// read the second half into the channels
		for (let i = 0, length = secondHalf.length; i < length; j += channelCount) {
			for (let channel = 0; channel < channelCount; channel++, i++) {
				channels[channel][j] = secondHalf[i];
			}
		}
	} else {
		// read into the channels
		for (let i = read, j = 0; j < desiredLength; j += channelCount) {
			for (let channel = 0; channel < channelCount; channel++, i++) {
				channels[channel][j] = buffer[i];
			}
		}
		if (nextRead === bufferLength) {
			nextRead = 0;
		}
	}

	Atomics.store(fields, READ_OFFSET, nextRead);
	return true;
}

/// clear the data in the state and reset it
export function clear(state: AtomicRingBuffer) {
	state.buffer.fill(0);
	const fields = state.fields;
	Atomics.store(fields, READ_OFFSET, 0);
	Atomics.store(fields, WRITE_OFFSET, 0);
}

