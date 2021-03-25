const { AbiCoder } = require("web3-eth-abi");
const abi = require("web3-eth-abi");

function stripBytePrefix(bytes) {
	return bytes.substring(0, 2) === "0x" ? bytes.slice(2) : bytes;
}

function createExecutorId(id) {
	return `0x${String(id).padStart(8, "0")}`;
}

// Encodes an array of actions ({ to: address, calldata: bytes }) into the EVM call script format
// Sets spec id and concatenates per call
//   [ 20 bytes (address) ] + [ 4 bytes (uint32: calldata length) ] + [ calldataLength bytes (payload) ]
// Defaults spec id to 1
function encodeCallScript(actions, specId = 1) {
	return actions.reduce((script, { to, calldata }) => {
		const addr = abi.encodeParameter("address", to);
		const calldataBytes = stripBytePrefix(calldata.slice(2));
		const length = abi.encodeParameter("uint256", calldataBytes.length / 2);

		// Remove first 12 bytes of padding for addr and 28 bytes for uint32
		return (
			script +
			stripBytePrefix(addr).slice(24) +
			stripBytePrefix(length).slice(56) +
			calldataBytes
		);
	}, createExecutorId(specId));
}

/**
 * Encode ACT function call
 * @param {string} signature Function signature
 * @param {any[]} params
 */
function encodeActCall(signature, params = []) {
	const sigBytes = abi.encodeFunctionSignature(signature);

	const types = signature.replace(")", "").split("(")[1];

	// No params, return signature directly
	if (types === "") {
		return sigBytes;
	}

	const paramBytes = abi.encodeParameters(types.split(","), params);

	return `${sigBytes}${paramBytes.slice(2)}`;
}

const EMPTY_CALLS_SCRIPT = createExecutorId(1);

module.exports = {
	EMPTY_CALLS_SCRIPT,
	createExecutorId,
	encodeCallScript,
	encodeActCall,
};
