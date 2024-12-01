import {
	createWalletClient,
	custom,
	getContract,
  } from "https://esm.sh/viem";
  import { sepolia } from "https://esm.sh/viem/chains";
  
  const walletClient = createWalletClient({
	chain: sepolia,
	transport: custom(window.ethereum),
  });
  
  const accounts = await walletClient.requestAddresses();
  
  const [address] = accounts;
  
  const MoodContractAddress = "0x85bf958d25ab5c3e42ef3ec3fb724de3d2ba96c8";
  const MoodContractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			}
		],
		"name": "addCandidate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string[]",
				"name": "_candidateNames",
				"type": "string[]"
			},
			{
				"internalType": "uint256",
				"name": "_durationInMinutes",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_candidateIndex",
				"type": "uint256"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "candidates",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "voteCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllVotesOfCandiates",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "voteCount",
						"type": "uint256"
					}
				],
				"internalType": "struct Voting.Candidate[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getRemainingTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getVotingStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "voters",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "votingEnd",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "votingStart",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
  const contractInstance = getContract({
	address: MoodContractAddress,
	abi: MoodContractABI,
	client: walletClient,
  });
  
  const connectWalletBtn = document.getElementById("connectWalletBtn");
  const voteBtn = document.getElementById("voteBtn");
  const candidateNumberInput = document.getElementById("candidateNumber");
  const remainingTimeDisplay = document.getElementById("remainingTime");
  const votedMessage = document.getElementById("votedMessage");
  
  connectWalletBtn.addEventListener("click", connectToMetamask);
  voteBtn.addEventListener("click", vote);
  
  async function connectToMetamask() {
	if (window.ethereum) {
	  try {
		const accounts = await walletClient.requestAddresses();
		const [address] = accounts;
		document.getElementById("accountDisplay").innerText = `Account: ${address}`;

		fetchCandidates();
  
	  } catch (err) {
		console.error("Connection Error: ", err);
	  }
	} else {
	  alert("MetaMask is not installed!");
	}
  }
  
  async function fetchCandidates() {
	try {
	  console.log("Fetching candidates...");
	  const candidates = await contractInstance.read.getAllVotesOfCandiates();
	  const remainingTime = await contractInstance.read.getRemainingTime();
	  updateRemainingTime(remainingTime);
	  console.log("Candidates fetched:", candidates);
  
	  candidates.forEach((candidate, index) => {
		const listItem = document.createElement("li");
		listItem.innerText = `#${index + 1}: ${candidate.name} - ${candidate.voteCount} votes`;
		candidatesUl.appendChild(listItem);
	  });
  
	  const hasVoted = await contractInstance.read.voters(address);  // Use `read` for view functions in `viem`
	  
	  if (hasVoted) {
		voteBtn.style.display="none";
		candidateNumberInput.style.display="none";
		votedMessage.innerText="u have already voted";  
	  } else {
		voteBtn.style.display="block";
		candidateNumberInput.style.display="block";
		votedMessage.innerText="cast ur vote";
	  }
  
	} catch (error) {
	  console.error("Error fetching candidates:", error);
	}
  }
  
  async function vote() {
	try {
	  const candidateIndex = parseInt(candidateNumberInput.value);
  
	  
	  if (!address) {
		alert("No account connected!");
		return;
	  }

	  const tx = await contractInstance.write.vote({
		account: address, 
		args: [candidateIndex]
	  });
  
	  if (tx.hash) {
		await walletClient.waitForTransactionReceipt(tx.hash);
		alert("Vote cast successfully!");
	  }
	  fetchCandidates();    
	} catch (err) {
	  console.error("Voting Error: ", err);
	  alert(err.data ? err.data.message : err.message);
	}
  }
  function updateRemainingTime(remainingTime) {
	if (remainingTime > 0) {
	  remainingTimeDisplay.innerText = `${remainingTime} seconds`;
	} else {
	  remainingTimeDisplay.innerText = "Time for voting has elapsed!";
	}
  }
  