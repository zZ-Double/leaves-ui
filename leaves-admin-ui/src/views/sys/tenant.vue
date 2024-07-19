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
                <el-button v-hasPerm="['sys:role:save']" type="success" @click="openDialog()">
                    <template #icon><i-ep-plus /></template>新增
                </el-button>
                <el-button v-hasPerm="['sys:role:remove']" type="danger" :disabled="ids.length === 0"
                    @click="handleDelete()">
                    <template #icon><i-ep-delete /></template>删除
                </el-button>
            </template>

            <el-table v-loading="loading" :data="tenantList" border size="small" @selection-change="handleSelectionChange">

                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="tenantName" label="租户名称" min-width="80" align="center"/>
                <el-table-column prop="beginDate,endDate" label="有效期" min-width="100" align="center">
                    <template #default="scope">
                        {{ scope.row.beginDate }} 至 {{ scope.row.endDate }}
                    </template>
                </el-table-column>
                <el-table-column prop="dateDiff" label="剩余天数" align="center" width="80"/>
                <el-table-column prop="status" label="状态" align="center" width="80">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status == 'ENABLE'" type="success">启用</el-tag>
                        <el-tag v-else type="info">禁用</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" prop="createTime" width="150" />
                <el-table-column label="操作" fixed="right" align="left" width="150">
                    <template #default="scope">
                        <div v-if="scope.row.roleCode !== 'ROOT'">
                            <el-button v-hasPerm="['sys:role:update']" type="primary" link size="small"
                                @click.stop="openDialog(scope.row.id)"><i-ep-edit />编辑
                            </el-button>
                            <el-button v-hasPerm="['sys:role:remove']" type="primary" link size="small"
                                @click.stop="handleDelete(scope.row.id)"><i-ep-delete />删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <Pagination v-if="total > 0" v-model:total="total" v-model:page="queryParams.current"
                v-model:limit="queryParams.size" @pagination="handleQuery" />
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { TenantQuery, TenantType } from '@/api/sys/tenant/types'
import { pageTenant } from '@/api/sys/tenant/index'
import Pagination from '@/components/Pagination/index.vue'


let queryFormRef = ref()
let ids = ref<string[]>([])
let loading = ref(false)
let tenantList = ref<TenantType[]>([])
let total = ref(0)

const queryParams = reactive<TenantQuery>({
    keywords: '',
    status: '',
    current: 1,
    size: 10
})

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
function openDialog(id?: string) {

}
function handleDelete(id?: string) {

}
function handleSelectionChange(selection: any) {
    ids.value = selection.map((item: any) => item.id);
}


onMounted(() => {
    handleQuery()
})
</script>
<style scoped lang="scss"></style>