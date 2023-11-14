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
