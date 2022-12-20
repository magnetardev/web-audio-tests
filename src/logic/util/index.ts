import { unmute } from "../unmute"
export * from "./sounds";

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
	unmute();
	return new contextConstructor();
}

export function handlePause(this: AudioContext) {
	return this.suspend();
}

export function handleVolume(this: GainNode, event: Event) {
	let target = event.target as HTMLInputElement;
	this.gain.value = +target.value;
}
