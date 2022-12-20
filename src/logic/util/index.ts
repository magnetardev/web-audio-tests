export const playButton = document.getElementById("play") as HTMLButtonElement;

export const pauseButton = document.getElementById(
	"pause",
) as HTMLButtonElement;

export const volumeSlider = document.getElementById(
	"volume",
) as HTMLInputElement;

export function bindUI(context: AudioContext, gainNode: GainNode) {
	pauseButton.addEventListener("click", handlePause.bind(context));
	pauseButton.disabled = false;

	volumeSlider.addEventListener("input", handleVolume.bind(gainNode));
	volumeSlider.disabled = false;
	gainNode.gain.value = +volumeSlider.value;
}

export function createAudioContext() {
	type AudioContextConstructor = typeof AudioContext;
	let contextConstructor: AudioContextConstructor =
		self.AudioContext ||
		((self as any).webkitAudioContext as AudioContextConstructor);
	return new contextConstructor();
}

export function handlePause(this: AudioContext) {
	return this.suspend();
}

export function handleVolume(this: GainNode, event: Event) {
	let target = event.target as HTMLInputElement;
	this.gain.value = +target.value;
}

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
