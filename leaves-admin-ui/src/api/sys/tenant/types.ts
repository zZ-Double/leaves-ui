import { PageQuery, PageResult } from "@/api/types";


export interface TenantQuery extends PageQuery {
    keywords: string;
    status: string;
}

export interface TenantType {
    id?: string;
    tenantName: string;
    status: string;
    beginDate: string;
    endDate: string;
    createTime: string;
}

export type TenantPageResult = PageResult<TenantType[]>;