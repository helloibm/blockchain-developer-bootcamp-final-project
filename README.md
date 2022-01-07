# Blockchain twitter clone
This project is a basic twitter clone powered by the blockchain. 

You can create and delete tweets. The owner has the ability to ban and unban other users.

The frontend of the project can be found at `./src/` and the smart contracts can be found in the `./contracts/` folder.

### Prerequisites
* NodeJS
* Ganache 
* Truffle

### How to set up the project and run it
Run the following commands:
* `npm install`
* `npm install truffle -g`
* `truffle migrate --reset` (make sure you have ganache running when executing this command)
* `npm run dev`

### How to run smart contract tests
Run the command: 
* `truffle test`


