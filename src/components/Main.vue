<script setup lang="ts">
import { onMounted,onUpdated,ref  } from 'vue';
import {  Model } from '../model'
//TODO 可编辑路径。
// const model: Model = useModel("main")
// const apikey = window.electronAPI.getConfig('apiKey')
const model = new Model(window)

const execute_command = () => {
  model.execute_command()
}
const execute_gpt = () => {
  console.log("execute_gpt")
  model.execute_gpt()
}
const consoleRef = ref<HTMLDivElement | null>(null);

onUpdated(() => {
  // 将滚动条滚动到底部
  if (consoleRef.value) {
    consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
  }
});
// mounted(){
  // model.register_signals()
// }
onMounted(() => {
  model.register_signals()
})

</script>

<template>
  <div>
    <div class="margin">CurrentDir:{{ model.current_dir }}</div>
    <a-input-group  class="margin" compact>
      <a-input v-model:value="model.prompt.value" placeholder="input prompt..." style="width: 80%" />
      <a-button @click="execute_gpt">Chat</a-button>
    </a-input-group>

    <a-input-group  class="margin" compact>
      <a-input v-model:value="model.command.value" placeholder="waiting for gpt command..." style="width: 80%" />
      <a-button @click="execute_command">Excute</a-button>
    </a-input-group>

    <div>
      <div class="console" v-if="model.outputs" ref="consoleRef">
        <div v-for="line, index in model.outputs" :key="index">
          {{ line }}
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
.margin {
  margin: 10px;
}
.console{
  width: 100%;
  height: 300px;
  /* border: 1px solid #ccc; */
  overflow: auto;
}
</style>
