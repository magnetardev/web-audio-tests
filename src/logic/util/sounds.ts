export function generateWhiteNoiseSample() {
	return Math.random() * 2 - 1;
}

export function writeWhiteNoiseToChannel(channel: Float32Array) {
	for (let i = 0, length = channel.length; i < length; i++) {
		channel[i] = generateWhiteNoiseSample();
	}
}

export function writeWhiteNoiseToBuffer(buffer: AudioBuffer) {
	let left = buffer.getChannelData(0);
	let right = buffer.getChannelData(1);

	for (let i = 0, length = left.length; i < length; i++) {
		left[i] = generateWhiteNoiseSample();
		right[i] = generateWhiteNoiseSample();
	}
}

