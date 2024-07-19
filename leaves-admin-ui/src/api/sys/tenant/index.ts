import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { TenantPageResult, TenantQuery } from './types';
import { sys_base_url } from '..';

export function pageTenant(queryParams: TenantQuery): AxiosPromise<TenantPageResult> {
    return request({
        url: sys_base_url + 'tenant/page',
        method: 'get',
        params: queryParams,
    });
}