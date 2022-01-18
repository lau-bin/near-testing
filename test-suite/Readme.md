# Testing platform for Near
Supports testnet and nearup

## Considerations
**Nearup**  
The nearup instance should be running with default configuration  
**Testnet**  
Currently unabailable due to errors with the implementation, please use nearup

## Configure the network where tests will run
Before starting any test set the following environment variables
### NETWORK
* "testnet"
* "local" if you will use nearup

### TEST_ACCOUNT
* the path to your testnet account credentials, usually found at /home/.near-credentials