// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PmknToken is ERC20, Ownable {

    constructor() ERC20("PmknToken", "PMKN") {}

    function mint(address user, uint amt) public onlyOwner {
        _mint(user, amt);
    }

}