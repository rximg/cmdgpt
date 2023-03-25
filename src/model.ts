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
    // current_dir: Ref<string> = ref('C:\\Users\\kk')
    path_list: string[] = []
    window: any

    constructor(
        window: any,
    ){
        this.window = window
        this.path_list = reactive([])
        this.window.electronAPI.getPathList().then((path_list:string[]) => {
            for (let i = 0; i < path_list.length; i++) {
                this.path_list.push(path_list[i])
            }
            console.log('path_list',this.path_list)
        })
    }

    async execute_command() {
        const dir = this.path_list.join('/')
        await this.window.electronAPI.executeCommand(
            this.command.value, dir);
    }

    async execute_gpt() {
        this.command.value = await this.window.electronAPI.executeGPT(
            this.prompt.value
        );
        console.log('execute_gpt',this.command.value)
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
            this.outputs.push("\n")
          });
    }

    async change_dir(dir:string){
        console.log('change_dir',dir)
        await this.window.electronAPI.changeDir(dir);
        // this.current_dir.value = dir
        const path_list =  await this.window.electronAPI.getPathList()
        console.log('get path_list',path_list)
        this.path_list.splice(0,this.path_list.length)
        console.log('clean path_list',this.path_list)
        for (let i = 0; i < path_list.length; i++) {
            this.path_list.push(path_list[i])
        }
        console.log('path_list',this.path_list)
    }

    async oslistdir(dir:string){
        return await this.window.electronAPI.getFolderList(dir);
    }
}

