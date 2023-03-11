import { ref, reactive, Ref } from 'vue'

// contextBridge.exposeInMainWorld('electronAPI', {
//     ipcRenderer: ipcRenderer,
//     onCommandOutput: (callback) => {
//       ipcRenderer.on('command-output', (event, output) => {
//         callback(output);
//       });
//     },
//     onCommandExit: (callback) => {
//       ipcRenderer.on('command-exit', (event, exitCode) => {
//         callback(exitCode);
//       });
//     },
//     executeCommand: (command, cwd) => {
//       ipcRenderer.send('execute-command', { command, cwd });
//     },
//     executeGPT: () => {
//       ipcRenderer.send('execute-gpt',);
//     },
//     updateValues: (values) => {
//       ipcRenderer.send('update-values', { values });
//     }
//   })

export class Model {
    command:Ref<string> = ref('')
    outputs: string[] = reactive([])
    // data: Record<string, any> = {}
    prompt: Ref<string> = ref('')
    // openai_api: OpenAI
    current_dir: Ref<string> = ref('C:\\Users\\kk')
    //TODO 文件管理器，将路径换成面包屑？
    window: any

    constructor(
        window: any,
    ){
        this.window = window
    }

    async execute_command() {
        await this.window.electronAPI.executeCommand(
            this.command.value, this.current_dir.value);
    }

    async execute_gpt() {
        this.command.value = await this.window.electronAPI.executeGPT();
    }

    async update_values(values: Record<string, any>) {
        await this.window.electronAPI.updateValues(values);
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
}
