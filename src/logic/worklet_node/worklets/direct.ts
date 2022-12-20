import { generateWhiteNoiseSample } from "../../util/sounds";

class DirectProcessor extends AudioWorkletProcessor {
	process(_: Float32Array[][], outputs: Float32Array[][]) {
		let output = outputs[0];
		let leftChannel = output[0];
		let rightChannel = output[1];
		for (let i = 0, length = leftChannel.length; i < length; i++) {
			leftChannel[i] = generateWhiteNoiseSample();
			rightChannel[i] = generateWhiteNoiseSample();
		}
		return true;
	}
}

registerProcessor("direct-worklet", DirectProcessor);
