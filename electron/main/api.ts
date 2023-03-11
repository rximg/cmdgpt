import axios from 'axios';
// import { app, BrowserWindow, shell, ipcMain } from 'electron'
import os from 'os';

import { spawn } from 'node:child_process'
import * as iconv from 'iconv-lite'
import { Notification } from 'electron'
// import { ref, reactive, Ref } from 'vue'
// const { spawn } = require('child_process');
// 
// import { spawn } from 'child_process'
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
        console.log('post',this.apiKey ,response.data)
        return response.data;
    }
}

function splitPath(path:string) {
    // 将路径中的反斜杠替换为正斜杠
    const normalizedPath = path.replace(/\\/g, '/');
    // 切割路径
    const pathList = normalizedPath.split('/');
    // 移除空字符串和'.'项
    const filteredPathList = pathList.filter(item => item !== '' && item !== '.');
    // 返回结果
    return filteredPathList;
  }
  

export class Model {
    command:string //Ref<string> = ref('')
    outputs: string[] //= reactive([])
    // data: Record<string, any> = {}
    prompt:string// Ref<string> = ref('')
    openai_api: OpenAI
    current_dir: string//Ref<string> = ref('C:\\Users\\kk')
    window: any

    constructor(
        apiKey: string,
        model: string = 'gpt-3.5-turbo',) 
    {
        this.openai_api = new OpenAI(
            apiKey,
            model
        )
        // this.window = window
        console.log(this.openai_api)
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

    async execute_command(event,command:string,cwd:string) {
        process.chdir(cwd);

        const ls = spawn(command, [], { shell: true });
        let buffer = '';
        ls.stdout.on('data', (data) => {
          buffer += iconv.decode(data, 'gbk');
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            event.sender.send('command-output', line);
            // console.log(line);
          }
        });
        ls.stderr.on('data', (data) => {
          buffer += iconv.decode(data, 'gbk');
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            event.sender.send('command-output', line);
            // console.log(line);
          }
        });
        ls.on('close', (code) => {
          if (buffer) {
            event.sender.send('command-output', buffer);
            console.log(buffer);
          }
          event.sender.send('command-exit', code);
        });
    }

    async execute_gpt() {
        if(this.openai_api === undefined){
            throw new Error('openai api is not init')
        }
        const platform = os.platform();
        //TODO platform undefined
        const prompt = `你是一个命令行翻译器，你需要将自然语言描述翻译成${platform}操作系统可执行的命令。例如：linux平台上遍历当前目录，你返回ls。现在请将'${this.prompt}'翻译为命令行，只返回命令文本即可。`
        //TODO 乱码问题
        console.log(prompt)
        try {
            const response = await this.openai_api.sendCompletionRequest(prompt)
            console.log('response', response)
            // this.outputs.value.push(response.choices[0].text)
            // this.command.value = response.choices[0].text
            return response.choices[0].text
        } catch (error) {
            console.error(error)
            new Notification({ title: `HTTP CODE`, body: error }).show()
        }

    }
}

// export const useModel = (apiKey:string)=>{
//     const model = new Model(apiKey)
//     return model
// }