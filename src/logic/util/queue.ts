export class RingBuffer {
	read: number;
	write: number;
	buffer: Float32Array;
	bufferLength: number;
	channelCount: number;

	/// Creates the state object that is safe to be transferred between threads
	constructor(size: number, channelCount = 2) {
		const buffer = new Float32Array(size * channelCount);
		this.read = 0;
		this.write = 0;
		this.buffer = buffer;
		this.bufferLength = buffer.length;
		this.channelCount = channelCount;
	}

	/// Write bytes into the buffer.
	/// `state` is equivalent to `this`, but by structuring the code this way its easier to code split
	///
	/// input is the bytes to write, though is expected to be formatted as: 
	/// [channel_a, channel_b, channel_a, channel_b, ...]
	enqueue(input: Float32Array): boolean {
		// put state fields into variables to save on object lookups 
		const buffer = this.buffer;
		const bufferLength = this.bufferLength;
		const desiredLength = input.length;

		// load read and write indexes
		const read = this.read;
		const write = this.write;

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
		this.write = nextWrite;
		return true;
	}

	/// Read bytes from the buffers into the given channels.
	/// `state` is equivalent to `this`, but by structuring the code this way its easier to code split
	///
	/// channels is an array of output channels to write to. They are expected to be equal.
	dequeue(channels: Float32Array[]): boolean {
		// Get the desired length to write, if it exists
		const desiredLength = channels[0]?.length;
		if (!desiredLength) {
			return false;
		}

		// set state to variables to save on lookups
		const buffer = this.buffer;
		const bufferLength = this.bufferLength;
		const channelCount = this.channelCount;

		// load read and write indexes
		const read = this.read;
		const write = this.write;

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

		this.read = nextRead;
		return true;
	}

	/// clear the data in the state and reset it
	clear() {
		this.buffer.fill(0);
		this.read = 0;
		this.write = 0;
	}
}

