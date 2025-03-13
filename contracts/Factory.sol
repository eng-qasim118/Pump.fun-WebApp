// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import {Token} from "./Token.sol";
contract Factory {
    uint public immutable fees;
    address public owner;
    address [] public tokens;
    uint public totalTokens=0;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint sold;
        uint raised;
        bool isOpen;
    }

    mapping ( address => TokenSale) public TokenToSale;



    constructor (uint _fee){
        fees=_fee;
        owner=msg.sender;
    }

    function createToken(string memory _name , string memory _symbol) external payable{
        Token token = new Token(msg.sender,_name,_symbol,1_000_000 ether);
        tokens.push(address(token));
        totalTokens++;

        TokenSale memory sale = TokenSale(address(token),_name,msg.sender,0,0,true);
            TokenToSale[address(token)]=sale;
    }
}
