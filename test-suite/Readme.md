# Testing platform for Near
Supports testnet and nearup
Use the functions provided in "lib" to make your scripts

## Considerations
**Nearup**  
The nearup instance should be running with default configuration  
**Other networks**  
The network env must be set to the network name

## Configure the network where tests will run
Before starting any test set the following environment variables
Consider that the balance of the master account is limited on some networks
### NETWORK
* "testnet"
* "local" if you will use nearup