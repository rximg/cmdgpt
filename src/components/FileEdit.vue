<script setup lang="ts">
import { Model } from '../model'
import { onMounted, onUpdated, ref, Ref, computed, reactive, watch } from 'vue';
import { DownOutlined, FormOutlined, RetweetOutlined, FolderOpenOutlined } from '@ant-design/icons-vue';
const {model} = defineProps({ model: {
    type:Model,
    required: true
} });

const menuItemsData: Record<string, string[]> = reactive({});
const currentIndex: Ref<number> = ref(0);
const is_dir_editable = ref(false)
const subfolders:Ref<string[]> = ref([])

// console.log('model',model)

const set_dir_editable = (value: boolean) => {
    is_dir_editable.value = value
}

function splitPath(path: string) {
    const normalizedPath = path.replace(/\\/g, '/');
    const pathList = normalizedPath.split('/');
    const filteredPathList = pathList.filter(item => item !== '' && item !== '.');
    return filteredPathList;
}

const cd_into = (path_list_index:number,name:string) => {
    const dir = model.path_list.slice(0,path_list_index+1).join('/')+'/'+name
    model.change_dir(dir)
}

const enter_to_fullpath = () => {
    // const dir = model.path_list.join('/')
    model.change_dir(current_dir.value)
    is_dir_editable.value = false
}
const current_dir = computed({
    get: () => {
        //如果path_list最后一位是/或者\，则去掉
        if (model.path_list[model.path_list.length - 1] === '/' || model.path_list[model.path_list.length - 1] === '\\') {
            return model.path_list.slice(0, model.path_list.length - 1).join('/') + '/'
        } else {
            return model.path_list.join('/')
        }
    },
    set: (value) => {
        const path_list = splitPath(value);
        model.path_list.splice(0, model.path_list.length)
        for (let i = 0; i < path_list.length; i++) {
            model.path_list.push(path_list[i])
        }
        //value以/或者\\结尾，path_list添加上value的最后一个字符
        if (value.endsWith('/') || value.endsWith('\\')) {
            model.path_list.push(value.slice(-1))
        }
    },
});

// const currentIndex = ref(null);

// Define a reactive data property to store the menu items


// Define a watch effect to update menuItemsData whenever currentIndex changes
watch(currentIndex, async (newIndex: number) => {
    if (newIndex >= 0) {
        console.log(model.path_list)
        const newPathList = model.path_list.slice(0, model.path_list.length);

        const pathuntilIndex = newPathList.splice(0, newIndex + 1).join('/');
        console.log(model.path_list)
        const result = await model.oslistdir(pathuntilIndex);
        menuItemsData[newIndex.toString()] = result;
    } else {
        menuItemsData[newIndex.toString()] = [];
    }
});

// Define the computed property to return menuItemsData
// const menuItems = computed(() => {
//   return menuItemsData.value;
// });


function loadMenuItems(index: number) {
    currentIndex.value = index;
}

// sub folders
const load_folders = async () => {
    const result = await model.oslistdir(model.path_list.join('/'))
    subfolders.value = result
}

const cd_into_subfolder = (name:string) => {
    const dir = model.path_list.join('/')+'/'+name
    model.change_dir(dir)
}

</script>

<template>

<div>
      <!-- {{ is_dir_editable }} -->
      <div v-if="is_dir_editable">
        <a-input-group class="margin" compact>
          <a-input v-model:value="current_dir" placeholder="current dir..." style="width: 80%" size="small" />
          <a-button type="text" size="small" @click="enter_to_fullpath">
            <template #icon>
              <RetweetOutlined />
            </template>
        </a-button>
        </a-input-group>
      </div>
      <div v-else>
        <div class="dropdown-wrapper">{{ model.path_list[0] }}</div>
        <div  v-for="(name, i) in model.path_list.slice(1, model.path_list.length)" :key="i" class="dropdown-wrapper">
          <a-dropdown  @click.prevent @mouseenter="loadMenuItems(i)">
            <a  style="color: gray">{{ name }}
              <DownOutlined />
            </a>
            <template #overlay>
              <a-menu class="overflow">
                <a-menu-item v-for="(item, itemIndex) in menuItemsData[i.toString()]" :key="itemIndex" @click="cd_into(i,item)">
                  <a>{{ item }}</a>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div class="dropdown-wrapper">
            <a-dropdown @click.prevent @mouseenter="load_folders">
            <a  style="color: gray">
                <FolderOpenOutlined />
            </a>
            <template #overlay>
              <a-menu class="overflow">
                <a-menu-item v-for="(subname, subindex) in subfolders" :key="subindex" @click="cd_into_subfolder(subname)">
                  <a>{{ subname }}</a>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div class="dropdown-wrapper">
          <a-button type="text" size="small" @click="set_dir_editable(true)">
            <template #icon>
              <FormOutlined />
            </template>
          </a-button>
        </div>

      </div>
    </div>
</template>


<style scoped>
.dropdown-wrapper {
  display: inline-block;
  color: gray;
  margin-right: 5px;
  text-decoration-color: gray;
}


.overflow {
    max-height: 400px;
    overflow-y: auto;
  }

</style>
