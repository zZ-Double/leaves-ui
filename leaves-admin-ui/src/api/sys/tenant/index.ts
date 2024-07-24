import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { TenantPageResult, TenantQuery, TenantForm } from './types';
import { sys_base_url } from '..';
import { Option } from '../menu/types'

export function pageTenant(queryParams: TenantQuery): AxiosPromise<TenantPageResult> {
    return request({
        url: sys_base_url + 'tenant/page',
        method: 'get',
        params: queryParams,
    });
}

export function getTenant(id: string): AxiosPromise<TenantForm> {
    return request({
        url: sys_base_url + 'tenant/query/' + id,
        method: 'get',
    });
}

export function saveTenant(data: TenantForm) {
    return request({
        url: sys_base_url + 'tenant/save',
        method: 'post',
        data
    })
}

export function updateTenant(data: TenantForm) {
    return request({
        url: sys_base_url + 'tenant/update',
        method: 'post',
        data
    })
}

export function removeTenant(ids: string) {
    return request({
        url: sys_base_url + 'tenant/remove/' + ids,
        method: 'get',
    });
}

export function getTenantMenuIds(tenantId: string): AxiosPromise<string[]> {
    return request({
        url: sys_base_url + 'tenant/menus/' + tenantId,
        method: 'get',
    });
}

export function updateTenantMenus(tenantId: string, data: string): AxiosPromise<any> {
    return request({
      url: sys_base_url + 'tenant/menus/' + tenantId,
      method: 'post',
      data: data,
    });
}

export function tenantOptions():AxiosPromise<Option[]> {
    return request({
        url: sys_base_url + 'tenant/options',
        method: 'get'
    })
}