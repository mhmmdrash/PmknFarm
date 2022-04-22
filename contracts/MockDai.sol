// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DaiToken is ERC20 {

    modifier onlyOwner() {
        require(msg.sender == admin);
        _;
    }

    address public admin;
    constructor() ERC20("MockDaiToken","mDAI") public {
        admin = msg.sender;
        _mint(msg.sender, 10000 * 10 ** 18);
    }

    function mint(address account, uint amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint amount) external {
        _burn(account, amount);
    }
}