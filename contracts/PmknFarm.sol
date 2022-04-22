// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PmknToken.sol";

contract PmknFarm {
    // userAddress => stakingBalance
    mapping(address => uint256) public stakingBalance;
    // userAddress => isStaking boolean
    mapping(address => bool) public isStaking;
    // userAddress => timeStamp
    mapping(address => uint256) public startTime;
    // userAddress => pmknBalance
    mapping(address => uint256) public pmknBalance;

    string public name = "PmknFarm";

    IERC20 public daiToken;
    PmknToken public pmknToken;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);

    constructor(IERC20 _daiToken, PmknToken _pmknToken) public {
        daiToken = _daiToken;
        pmknToken = _pmknToken;
    }


    /// Core function shells

    function stake(uint amt) public {
        require(daiToken.balanceOf(msg.sender) >= amt && amt > 0, "Cannot stake zero tokens");
        if(isStaking[msg.sender] == true){
            uint256 toTransfer = calculateYieldTotal(msg.sender);
            pmknBalance[msg.sender] += toTransfer;
        }
        daiToken.transferFrom(msg.sender, address(this), amt);
        stakingBalance[msg.sender] += amt;
        startTime[msg.sender] = block.timestamp;
        isStaking[msg.sender] = true;
        emit Stake(msg.sender, amt);
    }


    function unstake(uint256 amount) public {
        require(
            isStaking[msg.sender] = true &&
            stakingBalance[msg.sender] >= amount, 
            "Nothing to unstake"
        );
        uint256 yieldTransfer = calculateYieldTotal(msg.sender);
        startTime[msg.sender] = block.timestamp; // bug fix
        // uint256 balanceTransfer = amount;
        // amount = 0;
        stakingBalance[msg.sender] -= amount;
        daiToken.transfer(msg.sender, amount);
        pmknBalance[msg.sender] += yieldTransfer;
        if(stakingBalance[msg.sender] == 0){
            isStaking[msg.sender] = false;
        }
        emit Unstake(msg.sender, amount);
    }


    function viewYieldBalance() public view returns(uint) {
        uint bal = calculateYieldTotal(msg.sender);
        bal += pmknBalance[msg.sender];
        return bal;
    }


    function withdrawYield() public {
        uint toTransfer = calculateYieldTotal(msg.sender);
        require(
            toTransfer > 0 || 
            pmknBalance[msg.sender] > 0, 
            "Nothing to withdraw"
        );
        if (pmknBalance[msg.sender] != 0) {
            uint oldBal = pmknBalance[msg.sender];
            pmknBalance[msg.sender] = 0;
            toTransfer += oldBal;
        }
        startTime[msg.sender] = block.timestamp;
        pmknToken.mint(msg.sender, toTransfer);
        emit YieldWithdraw(msg.sender, toTransfer);
    }


    function calculateYieldTime(address user) public view returns (uint) {
        uint timeDif = block.timestamp - startTime[user];
        return timeDif;
    }


    function calculateYieldTotal(address user) public view returns (uint) {
        uint time = calculateYieldTime(user) * 10 ** 18;
        uint rate = 86400;
        uint timeRate = time / rate;
        uint rawYield = (stakingBalance[user] * timeRate) / 10 ** 18;
        return rawYield;
    }
}