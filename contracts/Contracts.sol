pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;
    struct AdoptionDetails {
        address user;
        uint256 timestamp;
        address transactionOrigin; 
        uint action; // 0 for adoption, 1 for return
    }
    mapping(uint => AdoptionDetails[]) public petAdoptionHistory;

    // Adopting a pet
    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);

        adopters[petId] = msg.sender;
        petAdoptionHistory[petId].push(AdoptionDetails({
            user: msg.sender,
            timestamp: block.timestamp,
            transactionOrigin: tx.origin,
            action: 0 // 0 represents adoption
        }));

        return petId;
    }

    // Returning a pet
    function returnPet(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);

        adopters[petId] = address(0);
        petAdoptionHistory[petId].push(AdoptionDetails({
            user: msg.sender,
            timestamp: block.timestamp,
            transactionOrigin: tx.origin,
            action: 1 // 1 represents return
        }));

        return petId;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    // Get adoption history of a pet
    function getPetAdoptionHistory(uint petId) 
            public 
            view 
            returns (
                address[] memory users, 
                uint256[] memory timestamps, 
                address[] memory transactionOrigins, 
                uint[] memory actions
            ) 
        {
            uint length = petAdoptionHistory[petId].length;
            users = new address[](length);
            timestamps = new uint256[](length);
            transactionOrigins = new address[](length);
            actions = new uint[](length);

            for (uint i = 0; i < length; i++) {
                AdoptionDetails memory details = petAdoptionHistory[petId][i];
                users[i] = details.user;
                timestamps[i] = details.timestamp;
                transactionOrigins[i] = details.transactionOrigin;
                actions[i] = details.action;
            }
        }    
}

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    constructor () public {
        addCandidate("Frieda");
        addCandidate("Gina");
        addCandidate("Collins");
        addCandidate("Melissa");
        addCandidate("Jeanine");
        addCandidate("Elvia");
        addCandidate("Latisha");
        addCandidate("Coleman");
        addCandidate("Nichole");
        addCandidate("Fran");
        addCandidate("Leonor");
        addCandidate("Dean");
        addCandidate("Stevenson");
        addCandidate("Kristina");
        addCandidate("Ethel");
        addCandidate("Terry");
    }

    function addCandidate (string memory _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }
}

contract SendMeEther {
    
    string public functionCalled;
    
    //constructor of the contract SendMeEther
    constructor() public {
	functionCalled = "constructor";
    }

    //function allowing an ether payment to the contract address
    function receiveEther() external payable {
	functionCalled = "receiveEther";
    }

    //fallback function allowing an ether payment to the contract address 
    function() external payable {
	functionCalled = "fallback";
    }

} 



