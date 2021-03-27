/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const { encodeCallScript, encodeActCall } = require("./helpers/dao");
const { agvePayments1 } = require("./agvePayments1.json");
const { agvePayments2 } = require("./agvePayments2.json");
const { hnyPayments } = require("./hnyPayments.json");


const agent = "0xd811a03eeb2623556bf05bcd7f58874d2d784c26";
const voting = "0x5dcdf85f1b00ae648233d77e4a9879dad3a89563"; 
const agve = "0x3a97704a1b25f08aa230ae53b352e2e72ef52843"; 
const hny = "0x71850b7e9ee3f13ab46d67167341e4bdc905eef9";
const tm = "0xfd97188bcaf9fc0df5ab0a6cca263c3aada1f382";

const main = async () => {
	const signers = await hre.ethers.getSigners();
	console.log("\nusing: ", signers[0].address);

	console.log("\nAGVE payments 1");
	//await multiPayments(agve, agvePayments1, signers[0]);

 	console.log("AGVE payments 2");
	//await multiPayments(agve, agvePayments2, signers[0]);

	console.log("HNY payments 1");
	await multiPayments(hny, hnyPayments, signers[0]);
};

const multiPayments = async (token, paymentsList, signer) => {
	
	// encode transfer actions for all address amount pairs in payment list
	const calldatum = await Promise.all(
		paymentsList.map(
			async (user) =>
				await encodeActCall("transfer(address,address,uint256)", [
					token,
					user.receiverAddress,
					ethers.BigNumber.from(parseInt(parseFloat(user.amount) * 1000)).mul(1e15),
				])
		)
	);

	// create a basket of encoded actions
	const encodedActions = [];
	calldatum.map((data) => {
		encodedActions.push({
			to: agent,
			calldata: data,
		});
	});

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
				true
			]),
		},
	]);

	// pass the intent to the token manager
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
