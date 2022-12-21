type SetOffsetCallback = (value: number) => void;

export const KERNEL_LENGTH = 20;
export const RENDER_QUANTUM = 128;
export const FRAME_SIZE = KERNEL_LENGTH * RENDER_QUANTUM;
export const QUEUE_SIZE = 40960;

export function enqueue(
	input: Float32Array, 
	buffer: Float32Array, 
	bufferLength: number, 
	desiredLength: number, 
	read: number, 
	write: number, 
	setWrite: SetOffsetCallback
): boolean {
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
	setWrite(nextWrite);
	return true;
}

export function dequeue(
	channels: Float32Array[],
	buffer: Float32Array, 
	bufferLength: number, 
	channelCount: number,
	read: number,
	write: number,
	setRead: SetOffsetCallback,
): boolean {
	// Get the desired length to write, if it exists
	const desiredLength = channels[0]?.length;
	if (!desiredLength) {
		return false;
	}

	// determine if there's enough to read
	let available = write >= read ? write - read : write + bufferLength - read;
	if (available < desiredLength) {
		return false;
	}

	// determine if the read needs to be split
	// do the reading, based on whether or not it needs to be split
	let nextRead = read + desiredLength;
	if (nextRead > bufferLength) {
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

	setRead(nextRead);
	return true;
}

/** clear the data in the state and reset it */
export function clear(buffer: Float32Array, setRead: SetOffsetCallback, setWrite: SetOffsetCallback) {
	buffer.fill(0);
	setRead(0);
	setWrite(0);
}

