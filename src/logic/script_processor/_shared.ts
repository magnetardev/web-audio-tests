import { createAudioContext } from "../util";

export function initalizeContext() {
	const audioContext = createAudioContext();
	const gainNode = audioContext.createGain();
	const sourceNode = audioContext.createBufferSource();
	const scriptNode = audioContext.createScriptProcessor(1024, 0, 2);
	gainNode.connect(audioContext.destination);
	scriptNode.connect(gainNode);
	sourceNode.connect(scriptNode);
	return { audioContext, gainNode, sourceNode, scriptNode };
}
