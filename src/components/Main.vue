<script setup lang="ts">
import { onMounted, onUpdated, ref, Ref, computed, reactive, watch } from 'vue';
import { Model } from '../model'
import { DownOutlined, FormOutlined, RetweetOutlined } from '@ant-design/icons-vue';
import FileEdit from './FileEdit.vue'
// const model: Model = useModel("main")
// const apikey = window.electronAPI.getConfig('apiKey')
const model = new Model(window)
const gptinput = ref<HTMLDivElement | null>(null);
const commandinput = ref<HTMLDivElement | null>(null);
const loading_command = ref(false)
const loading_gpt = ref(false)
const execute_command = () => {
  loading_command.value = true
  model.execute_command().then((data) => {
    gptinput.value?.focus()
    loading_command.value = false
  })
}
const execute_gpt = () => {
  loading_gpt.value = true
  console.log('prompt', model.prompt.value)
  model.execute_gpt().then((data) => {
    commandinput.value?.focus()
    loading_gpt.value = false
  })
  // console.log('get gpt',data)
}


const consoleRef = ref<HTMLDivElement | null>(null);

onUpdated(() => {
  // 将滚动条滚动到底部
  if (consoleRef.value) {
    consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
  }
});


onMounted(() => {
  model.register_signals()
})

</script>

<template>
  <div>


    <FileEdit class="margin" :model="model" />

    <a-input-group class="margin" compact>
      <a-input v-model:value="model.prompt.value"
        :ref="gptinput" 
        placeholder="input prompt..." 
        style="width: 80%"
        @pressEnter="execute_gpt" />
      <a-button  style="width: 16%" :loading="loading_gpt" @click="execute_gpt">Chat</a-button>
    </a-input-group>

    <a-input-group class="margin" compact>
      <a-input v-model:value="model.command.value" 
      :ref="commandinput"
      placeholder="waiting for gpt command..." 
      style="width: 80%"

        @pressEnter="execute_command" />
      <a-button style="width: 16%" :loading="loading_command" @click="execute_command">Excute</a-button>
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

.console {
  width: 100%;
  height: 300px;
  /* border: 1px solid #ccc; */
  overflow: auto;
}

.dropdown-wrapper {
  display: inline-block;
  color: gray;
  margin-right: 5px;
  text-decoration-color: gray;
}</style>
