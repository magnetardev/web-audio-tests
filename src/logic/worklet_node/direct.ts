import { bindUI, playButton } from "../util";
import { initalizeContext } from "./_shared";
import workletURL from "./worklets/direct.ts?worker&url";

let audioContext: AudioContext;
let gainNode: GainNode;

async function init() {
	let context = await initalizeContext(workletURL, "direct-worklet");
	audioContext = context.audioContext;
	gainNode = context.gainNode;
	bindUI(audioContext, gainNode);
}

playButton.addEventListener("click", async function () {
	if (!audioContext) {
		await init();
	}
	return audioContext.resume();
});

