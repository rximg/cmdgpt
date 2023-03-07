import axios from 'axios';
import { ref, reactive, Ref } from 'vue'
// const { spawn } = require('child_process');
// 
import { spawn } from 'child_process'
export class OpenAI {
    private readonly apiKey: string;
    private readonly model: string;
    private readonly maxTokens: number;
    private readonly temperature: number;

    constructor(apiKey: string,
        model: string = 'text-davinci-003',
        maxTokens: number = 7,
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
    command: Ref<string> = ref('')
    outputs: string[] = reactive([])
    data: Record<string, any> = {}
    prompt: Ref<string> = ref('')
    openai_api: OpenAI
    current_dir: Ref<string> = ref('C:\\Users\\kk')
    window: any

    constructor(
        window: any,
        apiKey: string,
        model: string = 'text-davinci-003',) {
        this.openai_api = new OpenAI(
            apiKey,
            model
        )
        this.window = window
        console.log(this.openai_api,this.window)
    }


    register_signals(){
        this.window.electronAPI.onCommandOutput(output => {
            // 处理输出日志
            this.outputs.push(output)
          });
        this.window.electronAPI.onCommandExit(exitCode => {
            // 处理命令执行完毕的逻辑
            console.log('exitCode', exitCode)
          });
    }

    update_openai_api(
        apiKey: string,
        model: string = 'text-davinci-003',
    ) {
        this.openai_api = new OpenAI(
            apiKey,
            model
        )
    }

    async execute_command() {
        await this.window.electronAPI.executeCommand({
            command: this.command.value,
            cwd: this.current_dir.value
        })
    }

    async execute_openai_api() {
        if(this.openai_api === undefined){
            throw new Error('openai api is not init')
        }
        const response = await this.openai_api.sendCompletionRequest(this.prompt.value)
        // this.outputs.value.push(response.choices[0].text)
        this.command.value = response.choices[0].text
    }
}

// export const useModel = (apiKey:string)=>{
//     const model = new Model(apiKey)
//     return model
// }