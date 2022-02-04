import {readFileSync, writeFileSync} from "fs"
import path from "path"
import { isObject, isString, JSONPrettify } from "utilities"
import {logFile} from "./config"
import { replacer } from "./util"


export class Logger{

  static info(msg:string | Object | Array<any>, _console?:boolean){
    this.log(msg, "INFO", _console)
  }

  static error(msg:string | Object | Array<any>, _console?:boolean){
    this.log(msg, "ERROR", _console)
  }

  private static log(msg: any, type: string, _console?:boolean){
    let date = new Date()
    let message
    if (isString(msg)){
      if (msg.length >= 2){
        message = msg.charAt(0).toUpperCase() + msg.substring(1)
      }
    }
    else if (isObject(msg)){
      message = JSONPrettify(msg, replacer)
    }
    else if (Array.isArray(msg)){
      message = JSONPrettify(msg, replacer)
    }

    let toLog = `[${date.getDay()}:${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]: ${type} - ${message ? message : msg}`
    if (_console){
      console.log(toLog)
    }
    writeFileSync(logFile, toLog + "\n", {flag:'a'})
  }
}