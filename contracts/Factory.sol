// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import {Token} from "./Token.sol";
contract Factory {
    uint public constant target = 3 ether;
    uint public constant limit = 500_000 ether;


    uint public immutable fees ;
    address public owner;
    address [] public tokens;
    uint public totalTokens=0;

    event Created(address indexed token) ;
    event BuyToken(address indexed _address, uint _ammount);

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

    function getTokenSale(uint index) public view returns(TokenSale memory){
        return TokenToSale[tokens[index]];
    }

    function createToken(string memory _name , string memory _symbol) external payable{
        require(msg.value==fees);
        Token token = new Token(msg.sender,_name,_symbol,1_000_000 ether);
        tokens.push(address(token));
        totalTokens++;

        TokenSale memory sale = TokenSale(address(token),_name,msg.sender,0,0,true);
            TokenToSale[address(token)]=sale;

            emit Created(address(token));
    }

    function getCost(uint _sold) public pure returns (uint){
        uint floor= 0.0001 ether;
        uint step= 0.0001 ether;
        uint increment= 10000 ether;
        uint cost = (step*(_sold/increment))+floor;
        return cost;
    }

    function buyTOken(address _TOkenaddress , uint _ammount) external payable{
        TokenSale storage sale = TokenToSale[_TOkenaddress];
        require(sale.isOpen==true,"sale is close");
        require(_ammount >= 1 ether, "ammount too low");
        require(_ammount <= 10000 ether, "ammount to high");
        uint cost = getCost(sale.sold);
        uint price = cost*(_ammount/10 ** 18);
        require(msg.value>=price,"insufficient balance");
        sale.sold += _ammount;
        sale.raised+=price;

        if(sale.sold >= limit || sale.raised>=target){
            sale.isOpen=false;
        }

        Token(_TOkenaddress).transfer(msg.sender,_ammount);
        emit BuyToken(_TOkenaddress,_ammount);
    }

    function deposit(address _token) external {
        // The remaining token balance and the ETH raised
        // would go into a liquidity pool like Uniswap V3.
        // For simplicity we'll just transfer remaining
        // tokens and ETH raised to the creator.

        Token token = Token(_token);
        TokenSale memory sale = TokenToSale[_token];

        require(sale.isOpen == false, "Factory: Target not reached");

        // Transfer tokens
        token.transfer(sale.creator, token.balanceOf(address(this)));

        // Transfer ETH raised
        (bool success, ) = payable(sale.creator).call{value: sale.raised}("");
        require(success, "Factory: ETH transfer failed");
    }

    function withdraw(uint256 _amount) external {
        require(msg.sender == owner, "Factory: Not owner");

        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Factory: ETH transfer failed");
    }
}
