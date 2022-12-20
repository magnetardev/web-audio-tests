import { createAudioContext } from "../util";
import { UnmuteHandler, generateSilence } from "../unmute";

export async function initalizeContext(
	workletUrl: string,
	workletName: string,
	options?: any,
) {
	const audioContext = createAudioContext();
	const gainNode = audioContext.createGain();
	gainNode.connect(audioContext.destination);
	let unmuteHandler = new UnmuteHandler(audioContext, generateSilence());

	await audioContext.audioWorklet.addModule(workletUrl);
	const workletNode = new AudioWorkletNode(audioContext, workletName, {
		numberOfInputs: 0,
		numberOfOutputs: 1,
		outputChannelCount: [2],
		processorOptions: options,
	});
	workletNode.connect(gainNode);

	return { audioContext, gainNode, workletNode, unmuteHandler };
}
