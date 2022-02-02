import {readFileSync, writeFileSync} from "fs"
import path from "path"
import {logFile} from "../config"


export class Logger{

  static info(msg:string, _console:boolean){
    this.log(msg, "INFO", _console)
  }

  static error(msg:string, _console:boolean){
    this.log(msg, "ERROR", _console)
  }

  private static log(msg:string, type: string, _console:boolean){
    let date = new Date()
    let message
    if (msg.length >= 2){
      message = msg.charAt(0).toUpperCase() + msg.substring(1)
    }
    let toLog = `[${date.getDay()}:${date.getHours()}:${date.getSeconds()}]: ${type} - ${message ? message : msg}`
    if (_console){
      console.log(toLog)
    }
    writeFileSync(logFile, toLog + "\n", {flag:'a'})
  }
}