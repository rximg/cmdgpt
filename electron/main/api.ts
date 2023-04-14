import axios from 'axios';
// import { app, BrowserWindow, shell, ipcMain } from 'electron'
import os from 'os';
import fs from 'node:fs'
import path from 'node:path'
import { spawn, exec ,execSync} from 'node:child_process'
import * as iconv from 'iconv-lite'
import { Notification } from 'electron'
// const {  } = require('child_process');
// import { ref, reactive, Ref } from 'vue'
// const { spawn } = require('child_process');
// 
// import { spawn } from 'child_process'

// 获取默认编码
// const defaultEncoding = os.type() === 'Windows_NT' ? process.env['chcp'] : 'UTF-8';
// console.log(process.env['chcp'])
// console.log(`默认编码为：${defaultEncoding}`);
function getPowerShellEncoding() {
  try {
    const command = 'powershell.exe -Command "$OutputEncoding = [Console]::OutputEncoding; [Console]::OutputEncoding.EncodingName"';
    const encoding = execSync(command, { encoding: 'utf8' }).trim();
    return encoding;
  } catch (error) {
    console.error('Error occurred while trying to get PowerShell encoding:', error);
    return null;
  }
}
export class OpenAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(apiKey: string,
    model: string = 'gpt-3.5-turbo',
    maxTokens: number = 20,
    temperature: number = 0) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  public async sendCompletionRequest(prompt: string) {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      prompt,
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    // console.log('post',this.apiKey ,response.data)
    return response.data;
  }
}

function splitPath(path: string) {
  const normalizedPath = path.replace(/\\/g, '/');
  const pathList = normalizedPath.split('/');
  const filteredPathList = pathList.filter(item => item !== '' && item !== '.');
  return filteredPathList;
}


export class Model {
  command: string //Ref<string> = ref('')
  outputs: string[] //= reactive([])
  // data: Record<string, any> = {}
  prompt: string// Ref<string> = ref('')
  openai_api: OpenAI
  // current_dir: string//Ref<string> = ref('C:\\Users\\kk')
  window: any
  platform: string
  cmd: string
  path_list: string[]
  defaultEncoding:string

  constructor(
    apiKey: string,
    model: string = 'text-davinci-003',) {
    //win32系统默认为powershell，linux系统默认为bash
    this.platform = os.platform();
    if (this.platform === 'win32') {
      this.cmd = 'powershell.exe';
    } else {
      this.cmd = 'bash';
    }

    this.openai_api = new OpenAI(
      apiKey,
      model
    )
    // this.window = window
    console.log(this.openai_api)
    const user_dir = os.homedir()
    this.path_list = splitPath(user_dir)
    this.defaultEncoding = getPowerShellEncoding()
  }


  // register_signals(){
  //     this.window.electronAPI.onCommandOutput(output => {
  //         // 处理输出日志
  //         this.outputs.push(output)
  //       });
  //     this.window.electronAPI.onCommandExit(exitCode => {
  //         // 处理命令执行完毕的逻辑
  //         console.log('exitCode', exitCode)
  //       });
  // }

  update_values(values: Record<string, any>) {
    this.prompt = values.prompt
    this.command = values.command
  }

  update_openai_api(
    apiKey: string,
    model: string = 'gpt-3.5-turbo',
  ) {
    this.openai_api = new OpenAI(
      apiKey,
      model
    )
  }


  async execute_command(event, command: string) {
    const cwd = this.path_list.join('/');
    // const setUtf8Command = ` && ${command}`;
    
    const ps = spawn(this.cmd, [command],
    {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      // shell: true,
    });
    // ps.stdin.write(command + '\n');
    ps.stdout.on('data', (data) => {
      const lines = iconv.decode(data, this.defaultEncoding).split('\n');
      for (const line of lines) {
        event.sender.send('command-output', line);
      }
    });
    
    ps.stderr.on('data', (data) => {
      const lines = iconv.decode(data, this.defaultEncoding).split('\n');
      for (const line of lines) {
        event.sender.send('command-output', line);
        console.log(line);
      }
    });
    
    ps.on('close', (code) => {
      event.sender.send('command-exit', code);
    });
  }
  

  async execute_gpt(event, input: string) {
    if (this.openai_api === undefined) {
      throw new Error('openai api is not init')
    }
    // const prompt = `You act as a command-line translator. You need to translate natural language descriptions into commands that can be executed on ${this.platform} operating systems. For example, for the Linux platform, if someone says 'traverse the current directory', you should return 'ls'. Now, please translate '${input}' into a command and return only the command text.`
    const prompt = `You act as a command-line translator. You need to translate natural language descriptions 
into commands that can be executed on ${this.platform} operating systems. For example, for the Linux platform, 
if someone says 'traverse the current directory', you should return 'ls'. Now, please translate '${input}' 
into a command and return only the command text.`;

    console.log('prompt:', prompt)
    try {
      const response = await this.openai_api.sendCompletionRequest(prompt)
      console.log('response', response)
      // this.outputs.value.push(response.choices[0].text)
      // this.command.value = response.choices[0].text

      return response.choices[0].text
    } catch (error) {
      // console.error(error)
      // event.sender.send('command-output', error);
      // return error
      new Notification({ title: `HTTP CODE`, body: error }).show()
    }

  }

  changeDir(path: string) {
    this.path_list = splitPath(path)
  }

  get_path_list() {
    return this.path_list
  }

  get_folder_list(dir: string) {
    const folder_list = [];

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = `${dir}/${file}`;
      try {

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          folder_list.push(file);
        }
      } catch (error) {
        console.error(error)
      }
    }

    return folder_list;
  }
}

// export const useModel = (apiKey:string)=>{
//     const model = new Model(apiKey)
//     return model
// }