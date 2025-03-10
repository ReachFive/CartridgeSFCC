/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />

interface ReachFiveSessionType {
    profile: object | null;
    id_token: string;
    access_token: string;
    refresh_token: string;
    provider_access_token: string;
    access_token_exp: number;
    access_token_iat: number;
    one_time_token: string;
    has_password: boolean;
    initialize(authRespObj: {
        access_token: string;
        id_token: string;
        provider_access_token?: string;
        refresh_token?: string;
        token_type: string;
        expires_in: string;
    }): void;
    isAccessToken5MinLimit(): boolean;
    isOneTimeTkn(): boolean;
}

export = ReachFiveSessionType;
