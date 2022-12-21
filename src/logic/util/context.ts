import { unmute } from "./unmute";

export function createAudioContext() {
	type AudioContextConstructor = typeof AudioContext;
	let contextConstructor: AudioContextConstructor =
		self.AudioContext ||
		((self as any).webkitAudioContext as AudioContextConstructor);
	return new contextConstructor();
}

interface Context {
	audioContext: AudioContext;
	gainNode: GainNode;
}

interface WorkletContext extends Context {
	workletNode: AudioWorkletNode;
}

interface SpnContext extends Context {
	scriptNode: ScriptProcessorNode;
	sourceNode: AudioBufferSourceNode;
}

export const CHANNEL_COUNT = 2;

export function initalizeSpnContext(): SpnContext {
	const audioContext = createAudioContext();
	unmute();
	const gainNode = audioContext.createGain();
	const sourceNode = audioContext.createBufferSource();
	const scriptNode = audioContext.createScriptProcessor(1024, 0, CHANNEL_COUNT);
	gainNode.connect(audioContext.destination);
	scriptNode.connect(gainNode);
	sourceNode.connect(scriptNode);
	return { audioContext, gainNode, sourceNode, scriptNode };
}

export async function initializeWorkletContext(
	workletUrl: string,
	workletName: string,
	options?: AudioWorkletNodeOptions["processorOptions"]
): Promise<WorkletContext> {
	const audioContext = createAudioContext();
	unmute();
	const gainNode = audioContext.createGain();
	gainNode.connect(audioContext.destination);

	await audioContext.audioWorklet.addModule(workletUrl);
	const workletNode = new AudioWorkletNode(audioContext, workletName, {
		numberOfInputs: 0,
		numberOfOutputs: 1,
		outputChannelCount: [CHANNEL_COUNT],
		processorOptions: options,
	});
	workletNode.connect(gainNode);

	return { audioContext, gainNode, workletNode };
}
