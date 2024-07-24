<template>
    <div class="app-container">
        <div class="search-container">
            <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                <el-form-item label="关键字" prop="keywords">
                    <el-input v-model="queryParams.keywords" placeholder="租户名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 200px">
                        <el-option label="启用" value="ENABLE" />
                        <el-option label="禁用" value="DISABLE" />
                    </el-select>
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
                <el-button v-hasPerm="['sys:tenant:save']" type="success" @click="openDialog()">
                    <template #icon><i-ep-plus /></template>新增
                </el-button>
                <el-button v-hasPerm="['sys:tenant:remove']" type="danger" :disabled="ids.length === 0"
                    @click="handleDelete()">
                    <template #icon><i-ep-delete /></template>删除
                </el-button>
            </template>

            <el-table v-loading="loading" :data="tenantList" border size="small" @selection-change="handleSelectionChange">

                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="tenantName" label="租户名称" min-width="80" align="center" />
                <el-table-column prop="beginDate,endDate" label="有效期" min-width="100" align="center">
                    <template #default="scope">
                        {{ scope.row.beginDate }} 至 {{ scope.row.endDate }}
                    </template>
                </el-table-column>
                <el-table-column prop="dateDiff" label="剩余天数" align="center" width="80" />
                <el-table-column prop="status" label="状态" align="center" width="80">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status == 'ENABLE'" type="success">启用</el-tag>
                        <el-tag v-else type="info">禁用</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" prop="createTime" width="150" />
                <el-table-column label="操作" fixed="right" align="left" width="200">
                    <template #default="scope">
                        <div v-if="scope.row.roleCode !== 'ROOT'">
                            <el-button v-hasPerm="['sys:tenant:menus:save']" type="primary" link size="small"
                                @click.stop="openMenuDialog(scope.row)"><i-ep-position />分配权限
                            </el-button>
                            <el-button v-hasPerm="['sys:tenant:update']" type="primary" link size="small"
                                @click.stop="openDialog(scope.row.id)"><i-ep-edit />编辑
                            </el-button>
                            <el-button v-hasPerm="['sys:tenant:remove']" type="danger" link size="small"
                                @click.stop="handleDelete(scope.row.id)"><i-ep-delete />删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <Pagination v-if="total > 0" v-model:total="total" v-model:page="queryParams.current"
                v-model:limit="queryParams.size" @pagination="handleQuery" />
        </el-card>

        <!-- 租户表单弹窗 -->
        <el-dialog v-model="state.visible" :title="state.title" width="500px" @close="closeDialog">
            <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
                <el-form-item label="租户名称" prop="tenantName">
                    <el-input v-model="formData.tenantName" placeholder="请输入租户名称" />
                </el-form-item>

                <el-form-item label="有效期" style="font-weight: bold" prop="dateRange">
                    <el-date-picker v-model="formData.dateRange" type="datetimerange" start-placeholder="开始时间"
                        end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
                        date-format="YYYY/MM/DD ddd" time-format="A hh:mm:ss" />
                </el-form-item>

                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio label="ENABLE">启用</el-radio>
                        <el-radio label="DISABLE">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>

            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                    <el-button @click="closeDialog">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 分配菜单弹窗  -->
        <el-dialog v-model="state.menuDialogVisible" :title="'【' + state.tenantName + '】权限分配'" width="800px">
            <el-scrollbar v-loading="loading" max-height="600px">
                <el-tree ref="menuRef" node-key="value" show-checkbox :data="menuList" :default-expand-all="true">
                    <template #default="{ data }">
                        {{ data.label }}
                    </template>
                </el-tree>
            </el-scrollbar>

            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="handleRoleMenuSubmit">确 定</el-button>
                    <el-button @click="state.menuDialogVisible = false">取 消</el-button>
                </div>
            </template>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import { TenantQuery, TenantType, TenantForm } from '@/api/sys/tenant/types'
import { pageTenant, getTenant, saveTenant, updateTenant, removeTenant, getTenantMenuIds, updateTenantMenus } from '@/api/sys/tenant/index'
import Pagination from '@/components/Pagination/index.vue'
import { Option } from '@/api/sys/menu/types';
import { menuOptions } from '@/api/sys/menu';

// 测试git提交
let queryFormRef = ref()
let dataFormRef = ref()
let menuRef = ref()


let ids = ref<string[]>([])
let loading = ref(false)
let tenantList = ref<TenantType[]>([])
let total = ref(0)
let menuList = ref<Option[]>([])

const queryParams = reactive<TenantQuery>({
    keywords: '',
    status: '',
    current: 1,
    size: 10
})

const state = reactive({
    visible: false,
    title: '',
    roleId: '',
    tenantName: '',
    menuDialogVisible: false,
    menuDialogTitle: ''

})

const formData = reactive<TenantForm>({
    id: '',
    tenantName: '',
    beginDate: '',
    endDate: '',
    status: 'ENABLE',
    dateRange: ''
})

const rules = reactive({
    tenantName: [{ required: true, message: "请输入租户名称", trigger: "blur" }],
    dateRange: [{ required: true, message: "请选择有效期", trigger: "blur" }],
    status: [{ required: true, message: "请选择状态", trigger: "blur" }],
});

function handleQuery() {
    loading.value = true
    pageTenant(queryParams)
        .then(({ data }) => {
            tenantList.value = data.records
            total.value = data.total
        }).finally(() => {
            loading.value = false;
        })

}
function resetQuery() {
    queryFormRef.value.resetFields()
    handleQuery()
}
function handleDelete(id?: string) {
    const tenantIds = [id || ids.value].join(",");
    if (!tenantIds) {
        ElMessage.warning("请勾选删除项");
        return false;
    }

    ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
    }).then(() => {
        removeTenant(tenantIds).then(() => {
            ElMessage.success("删除成功");
            handleQuery();
        });
    }).catch(() => {
        ElMessage.info("已取消删除")
    }).finally(() => {
        loading.value = false;
    })
}
function handleSelectionChange(selection: any) {
    ids.value = selection.map((item: any) => item.id);
}

function openDialog(id?: string) {
    state.visible = true;
    if (id) {
        state.title = "修改租户";
        getTenant(id).then(({ data }) => {
            Object.assign(formData, data);
        })
    } else {
        state.title = "新增租户";
    }
}
function closeDialog() {
    state.visible = false
    resetForm()
}
// 重置表单
function resetForm() {

    dataFormRef.value.resetFields();
    dataFormRef.value.clearValidate();

    formData.id = undefined
    formData.tenantName = ''
    formData.dateRange = ''
    formData.status = 'ENABLE'
}

function handleSubmit() {
    dataFormRef.value.validate((isValid: boolean) => {
        if (isValid) {
            if (formData.id) {
                formData.beginDate = ''
                formData.endDate = ''
                updateTenant(formData).then(() => {
                    ElMessage.success('修改成功');
                    closeDialog();
                    handleQuery();
                }).finally(() => {
                    loading.value = false;
                })
            } else {
                saveTenant(formData).then(() => {
                    ElMessage.success('新增成功');
                    closeDialog();
                    handleQuery();
                }).finally(() => {
                    loading.value = false;
                })
            }
        }
    });
}

/** 打开分配菜单弹窗 */
function openMenuDialog(row: TenantType) {
    const id = row.id;
    if (id) {
        state.roleId = id
        state.tenantName = row.tenantName
        state.menuDialogVisible = true;
        loading.value = true;

        // 获取所有的菜单
        menuOptions().then(({ data }) => {
            menuList.value = data
            // 回显角色已拥有的菜单
            getTenantMenuIds(id).then(({ data }) => {
                const checkedMenuIds = data
                checkedMenuIds.forEach((menuId) =>
                    menuRef.value.setChecked(menuId, true, false)
                )
            }).finally(() => {
                loading.value = false;
            })
        });
    }
}

function handleRoleMenuSubmit() {
    const roleId = state.roleId;
    if (roleId) {
        const checkedMenuIds: string = menuRef.value.getCheckedNodes(false, true).map((node: any) => node.value)
        loading.value = true;
        updateTenantMenus(roleId, checkedMenuIds).then(() => {
            ElMessage.success("分配权限成功");
            state.menuDialogVisible = false;
            resetQuery();
        }).finally(() => {
            loading.value = false;
        })
    }
}

onMounted(() => {
    handleQuery()
})
</script>
<style scoped lang="scss"></style>