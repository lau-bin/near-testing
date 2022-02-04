import { readdirSync } from "fs"
import path from "path"
import {assert, hasValue} from "utilities"
import "./init"
import { readLine } from "./interactiveConsole.js"
import { Logger } from "./logger.js"
let targetScript = process.env.TARGET_SCRIPT

let scripts = readdirSync(path.join(__dirname, "scripts"))
if (hasValue(targetScript) && scripts.includes(targetScript)){
  await import(path.join(__dirname, "scripts", targetScript))
}
else{
  scripts = scripts.filter(file => !file.startsWith("."))
  console.log("select script to run or 'q' to quit\n")
  for (let index = 0; index < scripts.length; index++) {
    let element = scripts[index]
    let extension = element.lastIndexOf('.')
    if (extension && extension > 0){
      element = element.substring(0, extension)
    }
    console.log(index + 1 + "> " + element)
  }
  let command = await readLine()
  if (command.toLowerCase() === "q"){
    process.exit(0)
  }
  let option = Number.parseInt(command)
  
  if (Number.isInteger(option) && option <= scripts.length && option > 0){
    Logger.info("executing \"" + scripts[option - 1] + "\"", true)
    await import(path.join("..", "scripts", scripts[option - 1]))
  }
  else{
    console.log("Invalid option")
    process.exit(1)
  }
}
