import { bindUI, playButton, initializeWorkletContext } from "./util";
import workletUrl from "./worklets/direct.ts?worker&url";

let audioContext: AudioContext;
let gainNode: GainNode;

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		let context = await initializeWorkletContext(workletUrl, "direct-worklet");
		audioContext = context.audioContext;
		gainNode = context.gainNode;
		bindUI(audioContext, gainNode);
	}
	return audioContext.resume();
});

