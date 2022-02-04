import {createInterface} from "readline"

export async function evalFromTerminal(_this:any) {
  if (process.argv.length >= 2 && (process.argv[2] === "-i" || process.argv[2] === "-il")) {
    await run.call(_this)
  }
}

async function run(){
  console.log("<Interactive mode>")
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  let interactive = true
  while (interactive) {
    await new Promise<void>(resolve => {
      rl.question("_>", (command) => {
        if (command === "return") {
          rl.close()
          interactive = false
          return resolve()
        }
        eval(command)
        resolve()
      })
    })
  }
  console.log("<Console closed>")
}

export async function readLine(){
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise<string>(resolve => {
    rl.question("_>", (command) => {
      rl.close()
      return resolve(command)
    })
  })
}