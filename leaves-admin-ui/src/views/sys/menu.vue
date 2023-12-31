<template>
    <div class="app-container">
        <div class="search-container">
            <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                <el-form-item label="关键字" prop="keywords">
                    <el-input v-model="queryParams.keywords" placeholder="菜单名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleQuery">
                        <template #icon><i-ep-search /></template><!-- 自动导入图标使用方法 -->
                        搜索
                    </el-button>
                    <el-button @click="resetQuery">
                        <template #icon><i-ep-refresh /></template>
                        重置
                    </el-button>
                </el-form-item>
            </el-form>
        </div>

        <el-card>
            <template #header>
                <el-button v-hasPerm="['sys:menu:save']" type="success" @click="openDialog('0')">
                    <template #icon><i-ep-plus /></template>新增</el-button>
            </template>

            <el-table v-loading="loading" :data="menuList" highlight-current-row
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" row-key="id" default-expand-all border
                size="small">
                <el-table-column label="菜单名称" min-width="180">
                    <template #default="scope">
                        <svg-icon :icon-class="scope.row.type === MenuTypeEnum.BUTTON ? 'button' : scope.row.icon" />
                        {{ scope.row.name }}
                    </template>
                </el-table-column>

                <el-table-column label="类型" align="center" width="80">
                    <template #default="scope">
                        <el-tag v-if="scope.row.type === MenuTypeEnum.CATALOG" type="warning">目录</el-tag>
                        <el-tag v-if="scope.row.type === MenuTypeEnum.MENU" type="success">菜单</el-tag>
                        <el-tag v-if="scope.row.type === MenuTypeEnum.BUTTON" type="danger">按钮</el-tag>
                        <el-tag v-if="scope.row.type === MenuTypeEnum.EXTLINK" type="info">外链</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="路由路径" align="left" width="120" prop="path" />

                <el-table-column label="组件路径" align="left" width="200" prop="component" />

                <el-table-column label="权限标识" align="center" width="170" prop="perm" />

                <el-table-column label="状态" align="center" width="80">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 'ENABLE'" type="success">显示</el-tag>
                        <el-tag v-else type="info">隐藏</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="排序" align="center" width="70" prop="sort" />

                <el-table-column fixed="right" align="center" label="操作" width="220">
                    <template #default="scope">
                        <el-button v-if="scope.row.type == 'CATALOG' || scope.row.type == 'MENU'"
                            v-hasPerm="['sys:menu:save']" type="primary" link size="small"
                            @click.stop="openDialog(scope.row.id)">
                            <i-ep-plus />新增
                        </el-button>

                        <el-button v-hasPerm="['sys:menu:update']" type="primary" link size="small"
                            @click.stop="openDialog(undefined, scope.row.id)">
                            <i-ep-edit />编辑
                        </el-button>
                        <el-button v-hasPerm="['sys:menu:remove']" type="primary" link size="small"
                            @click.stop="handleDelete(scope.row.id)">
                            <i-ep-delete />删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="state.visible" :title="state.title" destroy-on-close append-to-body width="750px"
            @close="closeDialog">
            <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
                <el-form-item label="父级菜单" prop="parentId">
                    <el-tree-select v-model="formData.parentId" placeholder="选择上级菜单" :data="state.menuOptions" filterable
                        check-strictly :render-after-expand="false" />
                </el-form-item>

                <el-form-item label="菜单名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入菜单名称" />
                </el-form-item>

                <el-form-item label="菜单类型" prop="type">
                    <el-radio-group v-model="formData.type" @change="onMenuTypeChange">
                        <el-radio label="CATALOG">目录</el-radio>
                        <el-radio label="MENU">菜单</el-radio>
                        <el-radio label="BUTTON">按钮</el-radio>
                        <el-radio label="EXTLINK">外链</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item v-if="formData.type == 'EXTLINK'" label="外链地址" prop="path">
                    <el-input v-model="formData.path" placeholder="请输入外链完整路径" />
                </el-form-item>

                <el-form-item v-if="formData.type == MenuTypeEnum.CATALOG || formData.type == MenuTypeEnum.MENU"
                    label="路由路径" prop="path">
                    <el-input v-if="formData.type == MenuTypeEnum.CATALOG" v-model="formData.path" placeholder="system" />
                    <el-input v-else v-model="formData.path" placeholder="user" />
                </el-form-item>

                <!-- 组件页面完整路径 -->
                <el-form-item v-if="formData.type == MenuTypeEnum.MENU" label="页面路径" prop="component">
                    <el-input v-model="formData.component" placeholder="system/user/index" style="width: 95%">
                        <template v-if="formData.type == MenuTypeEnum.MENU" #prepend>src/views/</template>
                        <template v-if="formData.type == MenuTypeEnum.MENU" #append>.vue</template>
                    </el-input>
                </el-form-item>

                <!-- 权限标识 -->
                <el-form-item v-if="formData.type == 'BUTTON'" label="权限标识" prop="perm">
                    <el-input v-model="formData.perm" placeholder="sys:user:add" />
                </el-form-item>

                <el-form-item v-if="formData.type !== 'BUTTON'" label="图标" prop="icon">
                    <!-- 图标选择器 -->
                    <icon-select v-model="formData.icon" />
                </el-form-item>

                <el-form-item v-if="formData.type == MenuTypeEnum.CATALOG" label="跳转路由">
                    <el-input v-model="formData.redirect" placeholder="跳转路由" />
                </el-form-item>

                <el-form-item v-if="formData.type !== 'BUTTON'" label="状态">
                    <el-radio-group v-model="formData.status">
                        <el-radio label="ENABLE">显示</el-radio>
                        <el-radio label="DISABLE">隐藏</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="排序" prop="sort">
                    <el-input-number v-model="formData.sort" style="width: 100px" controls-position="right" :min="0" />
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="closeDialog">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
// 依赖
import { MenuTypeEnum } from '@/enums/MenuTypeEnum'
import IconSelect from '@/components/IconSelect/index.vue'
import { menuOptions, saveMenu, updateMenu, listMenus, getMenu, removeMenu } from '@/api/sys/menu/index'
import { Option, MenuForm, MenuVO } from '@/api/sys/menu/types';
// 获取form组件
let dataFormRef = ref()
let queryFormRef = ref()
// 变量定义
let loading = ref(false)

// 临时变量
const state = reactive({
    menuOptions: [] as Option[],
    visible: false,//dialog 可见性标识
    title: '',//dialog 标题
    type: "",// 菜单类型
    path: ""// 菜单路由路径
})
// 搜索条件
const queryParams = reactive({
    keywords: ''
})
// table数据
const menuList = ref<MenuVO[]>([])
// 表单提交数据
const formData: MenuForm = reactive({
    id: '',
    parentId: '',
    name: '',
    type: 'MENU',
    path: '',
    component: '',
    perm: '',
    icon: '',
    redirect: '',
    status: 'ENABLE',
    sort: 0
})

// 定义表单校验规则
const rules = reactive({
    parentId: [{ required: true, message: "请选择顶级菜单", trigger: "blur" }],
    name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
    type: [{ required: true, message: "请选择菜单类型", trigger: "blur" }],
    path: [{ required: true, message: "请输入路由路径", trigger: "blur" }],
    component: [
        { required: true, message: "请输入组件完整路径", trigger: "blur" },
    ],
});

/** 条件搜索 */
function handleQuery() {
    // 重置父组件
    loading.value = true;
    listMenus(queryParams)
        .then(({ data }) => {
            menuList.value = data;
        })
        .then(() => {
            loading.value = false;
        });
}

/** 重置搜索条件 */
function resetQuery() {
    queryFormRef.value.resetFields()
    handleQuery()
}

/** 打开弹窗 */
function openDialog(parentId?: string, menuId?: string) {
    const menuOptionsList: any[] = [];
    menuOptions().then(({ data }) => {
        const menuOption = { value: '0', label: '顶级菜单', children: data };
        menuOptionsList.push(menuOption);
        state.menuOptions = menuOptionsList;
    }).then(() => {
        state.visible = true;
        if (menuId) {
            state.title = "编辑菜单";
            getMenu(menuId).then(({ data }) => {
                console.log(data)
                Object.assign(formData, data);
                state.type = data.type ?? "";
                state.path = data.path ?? "";
            });
        } else {
            state.title = "新增菜单";
            formData.parentId = parentId;
        }
    });
}

/** 关闭弹窗 */
function closeDialog() {
    state.visible = false;
    resetForm();
}


/** 删除菜单 */
function handleDelete(menuId: string) {
    if (!menuId) {
        ElMessage.warning("请勾选删除项");
        return false;
    }

    ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
    }).then(() => {
        removeMenu(menuId).then(() => {
            ElMessage.success("删除成功");
            handleQuery();
        });
    }).catch(() => ElMessage.info("已取消删除"));
}

/** 菜单类型切换事件处理 */
function onMenuTypeChange() {
    // 如果菜单类型改变，清空路由路径；未改变在切换后还原路由路径
    if (formData.type !== state.type) {
        formData.path = "";
    } else {
        formData.path = state.path;
    }
}

/** 表单提交 */
function submitForm() {
    dataFormRef.value.validate((isValid: boolean) => {
        if (isValid) {
            if (formData.id) {
                updateMenu(formData).then(() => {
                    ElMessage.success('修改成功');
                    closeDialog();
                    handleQuery();
                });
            } else {
                saveMenu(formData).then(() => {
                    ElMessage.success('新增成功');
                    closeDialog();
                    handleQuery();
                });
            }
        }
    });
}

/** 重置表单 */
function resetForm() {
    dataFormRef.value.resetFields();
    dataFormRef.value.clearValidate();

    formData.id = undefined;
    formData.parentId = '0';
    formData.status = 'ENABLE';
    formData.sort = 1;
    formData.perm = undefined;
    formData.component = undefined;
    formData.path = undefined;
    formData.redirect = undefined;
}

// 组件挂载
onMounted(() => {
    handleQuery()
})

</script>
<style scoped lang="scss"></style>