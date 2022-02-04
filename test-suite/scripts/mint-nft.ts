import { existsSync, fstat, readdirSync, writeFileSync } from "fs"
import { Http2ServerRequest } from "http2"
import { Agent } from "https"
import { assert } from "utilities"
import { tokenTypes } from "./deploy"
import http from "http"
import { promisify } from "node:util"
import { Stream, Writable } from "stream"
import { createHash } from "crypto"
import { Contract } from "../lib/contract"
import { contracts } from "./contractSpec"
import { getExistentAcc } from "../lib/near"
import { getConfig } from "../lib/config"
import { NearConncetion } from "../lib/near-connection"
import { Logger } from "../lib/logger"
import { BN } from "bn.js"


const parsedDate = (() => {
  let currentDate = new Date()
  let month = paddDate(String((currentDate.getMonth() + 1)))
  let day = paddDate(currentDate.getDate().toString())
  let hour = paddDate(currentDate.getHours())
  let minute = paddDate(currentDate.getMinutes())
  let second = paddDate(currentDate.getSeconds())
  return `${currentDate.getFullYear()}-${month}-${day}T${hour}:${minute}:${second}`
})()

let nfts = await parseNFTFromFile("cookiefactory.co", 2, 20)

let fullNFT = nfts.map(nft => {
  let fullNFT: NFT = {
    perpetual_royalties: [{
      account: "user1.cookiefactory.testnet",
      rlty: 1
    }],
    metadata: {
      copies: "0",
      description: "A good quality NFT",
      issued_at: parsedDate,
      media: nft.url,
      media_hash: nft.hash,
      title: nft.name
    }
  }
  return fullNFT
})
let config = getConfig()
let connection = await NearConncetion.build(config)

let nftOwnerAcc = await getExistentAcc(config.existentAcc.owner.name, connection, config.existentAcc.owner.key)
let nftContract = new Contract(config.existentAcc.nft_simple.name, contracts.nft, "nft")
Logger.info("starting to mint nfts", true)

for (let nft of fullNFT) {
  let rlty = {}
  nft.perpetual_royalties.forEach(el => {
    Object.defineProperty(rlty, el.account, {
      enumerable: true,
      value: el.rlty
    })
  })

  await nftContract.call.nft_mint(
    nftOwnerAcc,
    {
      metadata: nft.metadata,
      perpetual_royalties: rlty,
      receiver_id: "cookiefactory.testnet"
    },
    undefined,
    new BN("10200000000000000000000")
  )
  Logger.info("minted " + nft.metadata.title, true)
}

type NFT = {
  metadata: {
    title: string,
    description: string,
    media: string,
    media_hash: string,
    copies: "0",
    issued_at: string
  },
  perpetual_royalties: { account: string, rlty: number }[]
}

function paddDate(date: string | number) {
  date = String(date)
  if (date.length == 1) date = "0" + date
  return date
}

async function parseNFTFromFile(ipAddress: string, from: number, to: number) {
  let agent = new Agent({ maxCachedSessions: 0, keepAlive: true })
  let options = {
    hostname: ipAddress,
    port: 80,
    path: '',
    method: 'GET',
    // protocol: "https:"
  };
  let nfts: { hash: string, url: string, name: string }[] = []
  for (let i = from; i <= to; i++) {
    let stream = new Stream.Transform()
    let img: Uint8Array[] = []
    options.path = `/output/${i}.png`
    let response = await new Promise<Buffer>((resolve, reject) => {
      http.request(options, (res) => {
        res.on('data', function (chunk) {
          stream.push(chunk)
        });
        res.on('end', function () {
          img.push(stream.read())
          resolve(Buffer.concat(img))
        });
      }).end()
    })
    let hash = createHash("sha256", { encoding: "binary" }).update(response).digest("hex")
    nfts.push({
      hash,
      url: "https://" + options.hostname + options.path,
      name: "NFT Nº " + i
    })
  }

  return nfts
}


