
function paddDate(date) {
  if (date.length == 1) date = "0" + date
  return date
}
const currentDate = new Date()
let month = paddDate(String((currentDate.getMonth() + 1)))
let day = paddDate(currentDate.getDate().toString())
let hour = paddDate(currentDate.getHours())
let minute = paddDate(currentDate.getMinutes())
let second = paddDate(currentDate.getSeconds())
let parsedDate = `${currentDate.getFullYear()}-${month}-${day}T${hour}:${minute}:${second}`
const nftBase = {
  metadata: {
    title: undefined,
    description: undefined,
    media: undefined,
    media_hash: undefined,
    copies: "0",
    issued_at: parsedDate,
    starts_at: parsedDate,
    reference: undefined,
    reference_hash: undefined
  },
  perpetual_royalties: undefined,
  token_type: undefined
}
const tokenTypes = {
  token1: "token1",
  token2: "token2",
  token3: "token3",
  token4: "token4",
  token5: "token5"
}



const nftN1 = Object.assign({}, nftBase)
nftN1.metadata.title = "Token Nº1"
nftN1.metadata.description = "Some desc"
nftN1.metadata.media = "https://cookiefactory.co/output/582.png"
nftN1.metadata.media_hash = "709cf450782012061eb34f6c547021ce096fe478761e6e5ece9e1acb1c538413"
nftN1.metadata.reference = "ref url"
nftN1.metadata.reference_hash = "709cf450782012061eb34f6c547021ce096fe478761e6e5ece9e1acb1c538413"
nftN1.perpetual_royalties = new Map([["acc1", 2]])
// nftN1.token_type = tokenTypes.token1

function makeNFT(nft) {
  try {
    let nftHistory = JSON.parse(fs.readFileSync(path.join("res","nftHistory.json")))
    let lastCopy = nftHistory[nft.token_type]
    if (lastCopy != undefined) {
      nft.metadata.copies = String(lastCopy + 1)
      nftHistory[nft.token_type]++
    }
    else{
      nftHistory[nft.token_type] = 0
    }
    console.log("Copy Nº: " + nft.metadata.copies)
    fs.writeFileSync(path.join("res","nftHistory.json"), JSON.stringify(nftHistory))
    return nft
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}



async function main() {
  async function evalFromTerminal() {

    console.log("Interactive mode:")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let interactive = true
    while (interactive) {
      await new Promise(resolve => {
        rl.question("_>", async (command) => {
          if (command === "return") {
            rl.close()
            interactive = false
            return resolve()
          }
          try{
            await eval(command)
          }catch(e){
            console.error("Error: ")
            console.error(e)
          }
          resolve()
        })
      })
    }
  }


  //Start
  await initNear()
  let ownerAcc = await getAccFromFile(process.env.OWNER_ACC)
  console.log("Finished creating account/s");

  // set option to start console instead of script
  if (process.argv.length >= 2 && process.argv[2] === "-i") {
    await evalFromTerminal()
    return
  }
  //Begin
  try {

    console.log("Begin");

    // deploy contract
    console.log("Deploying contract")
    await deployNFTCtr(ownerAcc)

    // mint NFT
    // console.log("Minting")
    // loadContract(ownerAcc, process.env.NFT_ACCOUNT_ID, contracts.nft)

    // for (let i of util.times(1)){
    //   console.log("Nº " + i)
    //   await mintNFT(makeNFT(nftN1))
    // }


  } catch (e) {
    console.log("Error:\n" + e)
  }
  console.log("Done");

  if (process.argv.length >= 2 && process.argv[2] === "-il") {
    await evalFromTerminal()
    return
  }
} main()

async function mintNFT(nft, contract) {
  console.log("Minting: " + nft.metadata.title)
  await contract["nft_mint"](
    {
      metadata: nft.metadata,
      perpetual_royalties: Object.fromEntries(nft.perpetual_royalties),
      token_type: nft.token_type
    },
    undefined,
    new BN(nearAPI.utils.format.parseNearAmount("1"))
  )
}

async function deployNFTCtr(ownerAcc) {
  let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)
  let contractAcc = await createAccount(masterAcc, "nft-simple", 15, 5)
  console.log("contract NFT account:")
  console.log(contractAcc.accountId)
  console.log("Finished creating account/s");
  await deployContract(contractAcc, contracts.nft)
  loadContract(contractAcc, contractAcc.accountId, contracts.nft)
  console.log("Finished deploying contract/s");

  // instantiate contract
  console.log("instantiate market contract")
  await contractAcc[contractAcc.accountId]["new"](
    {
      owner_id: ownerAcc.accountId,
      metadata: {
        spec: "1.0.0",
        name: "nft-simple",
        symbol: "NFTS"
      },
      supply_cap_by_type: {
        [tokenTypes.token1]: "1",
        [tokenTypes.token2]: "10",
        [tokenTypes.token3]: "100",
        [tokenTypes.token4]: "1000",
        [tokenTypes.token5]: "10000"
      },
      locked: true
    }
  )
}