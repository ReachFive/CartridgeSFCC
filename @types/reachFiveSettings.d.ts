/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />

type SitePreferences = dw.system.SitePreferences;

interface ReachFiveSettings extends SitePreferences {
    isReachFiveEnabled: boolean;
    isReachFiveTransitionActive: boolean;
    reachFiveTransitionCookieDuration: number;
    isReachFiveSessionForcedAuth: boolean;
    isReach5ThemeActive: boolean;
    reach5Domain: string;
    reach5ApiKey: string;
    reach5ClientSecret: string;
    reachFiveProviderId: string;
    isReachFiveFastRegister: boolean;
    isReachFiveLoginAllowed: boolean;
    reach5ManagementApiKey: string;
    reach5ManagementClientSecret: string;
    reach5ManagementScope: string;
    reach5ProfileFieldsJSON: Record<string, unknown>;
    reach5UiSdkUrl: string;
    reach5CoreSdkUrl: string;
    reach5SupportedLanguageCodes: string[];
    reach5DefaulLanguageCode: string;
    reachFiveCheckCredentials: string;
    isReachFiveEmailAsLogin: boolean;
    isReachFiveReturnProviderToken: boolean;
}

export = ReachFiveSettings;