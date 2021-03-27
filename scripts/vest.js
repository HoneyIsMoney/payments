/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const { encodeCallScript, encodeActCall } = require("./helpers/dao");

const voting = "0x4a010d8b3f8b6ced72210035b55bc766247e0066";
const tm = "0xf54cfd271097cb96f5e2214d801c4553e01bcf51";
const multisig = "0x9b40D8a9EB71aEd5F525cb01A12A2D964321D69E";
const amount = "945.919023585127020580";
const start = "1617032977";
const vesting = "1617032977"; // Mon Feb 28 2022 12:00:00

const main = async () => {
	const signers = await hre.ethers.getSigners();
	console.log("\nusing: ", signers[0].address);

	console.log("Vest AGVE");
	await vest(amount, multisig, start, vesting, signers[0]);
};

const vest = async (amount, payee, start, vesting, signer) => {
	// encode transfer actions for all address amount pairs in payment list
	const calldatum = await Promise.all(
		[
			encodeActCall(
				"function assignVested(address,uint256,uint64,uint64,uint64,bool)",
				[
					payee,
					ethers.BigNumber.from(parseInt(parseFloat(amount) * 1000)).mul(1e15),
					start,
					start,
					vesting,
					true,
				]
			)
		]
	)


	// create a basket of encoded actions
	const encodedActions = [
		{
			to: tm,
			calldata: calldatum[0],
		},
	];

	// encode the script to be forwarded to the voting app
	const callscript = encodeCallScript(encodedActions);

	// the token manager has permission to call newVote() on the voting app
	// this creates the intent that must be forwarded
	const voteScript = encodeCallScript([
		{
			to: voting,
			calldata: encodeActCall("newVote(bytes,string,bool,bool)", [
				callscript,
				"",
				true,
				true,
			]),
		},
	]);

	const tokenManager = new ethers.Contract(
		tm,
		["function forward(bytes) external"],
		signer
	);

	// create the transaction
	await tokenManager.forward(voteScript);
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
