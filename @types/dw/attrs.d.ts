/**
 * Custom attributes for Profile object.
 */
declare class ProfileCustomAttributes {
  /**
   * [object Object]
   */
  data: string;

  /**
   * "true" if customer has Newsletter consent
   */
  isNewsletter: boolean;

  /**
   * ReachFive request error
   */
  reachfiveError: string;

  /**
   * Send ReachFive email verification
   */
  reachfiveSendVerificationEmail: boolean;

  /**
   * Send ReachFive phone verification
   */
  reachfiveSendVerificationPhone: boolean;

  /**
   * "true" if the customer is marked for deletion in SFCC and Reachfive
   */
  toDelete: boolean;
}

/**
 * Custom attributes for SitePreferences object.
 */
declare class SitePreferencesCustomAttributes {
  /**
   * Authentication token under Login Form
   */
  authenticated: string;

  /**
   * Cartridge name with controllers
   */
  cartridgeControllersName: string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showEmailEditor.html )
   */
  "email-editor": string;

  /**
   * Enables the split function concerning the kakao name - first character in lastname , the rest in firstname
   */
  enableKakaoTalkNameSplit: boolean;

  /**
   * If set to "No" falls back on "light" theme from SalesForce
   */
  isReach5ThemeActive: boolean;

  /**
   * Create profile with login as an email or not
   */
  isReachFiveEmailAsLogin: boolean;

  /**
   * Is ReachFive Enabled
   */
  isReachFiveEnabled: boolean;

  /**
   * When enabled, there's no complementary screen to collect further information about the user
   */
  isReachFiveFastRegister: boolean;

  /**
   * In Transition and Full CIAM modes, should be set to "Yes" to allow ReachFive components to handle login flows ; In SLO mode should be set to "No" to let SalesForce components to handle login flows
   */
  isReachFiveLoginAllowed: boolean;

  /**
   * Retrieve the provider token in the SFCC session
   */
  isReachFiveReturnProviderToken: boolean;

  /**
   * Automatic user authentication from any page
   */
  isReachFiveSessionForcedAuth: boolean;

  /**
   * Enables ReachFive transition flow to migrate users from SFCC to ReachFive seamlessly ; should be set to "Yes" for Transition mode and set to "No" for SLO and Full CIAM modes.
   */
  isReachFiveTransitionActive: boolean;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showSocialLogin.html)
   */
  "load-social-connect": string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showAuth.html ) ; This widget is used for the flow in the Home page
   */
  "load-social-connect-login": string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showAuth.html ) ; This widget is used for the flow in the Home page
   */
  "load-social-connect-signup": string;

  /**
   * Social Login under the login form
   */
  "load-social-connect2": string;

  /**
   * The client id/username to get the access token for OCAPI
   */
  ocapiTokenClientId: string;

  /**
   * The auth password to get the access token for OCAPI
   */
  ocapiTokenClientPassword: string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showPasswordEditor.html ) ; This widget is used in My Account dashboard
   */
  "password-editor": string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showPhoneNumberEditor.html )
   */
  "phone-editor": string;

  /**
   * Auth token under the login form
   */
  "re-auth-container": string;

  /**
   * ReachFive Identity API client ID
   */
  reach5ApiKey: string;

  /**
   * ReachFive Identity API client secret
   */
  reach5ClientSecret: string;

  /**
   * ReachFive Web Core SDK Url.
   */
  reach5CoreSdkUrl: string;

  /**
   * Defaul ReachFive LanguageCodes. It sets the language of ReachFive Form. The language lowercase ISO 639-1 code. e.g: en, es, fr, it, nl ... It is used when current site language is not supported.
   */
  reach5DefaulLanguageCode: string;

  /**
   * You can retrieve ReachFive domain under the Settings section of the ReachFive Console.
   */
  reach5Domain: string;

  /**
   * Define the API KEY for the Management API
   */
  reach5ManagementApiKey: string;

  /**
   * Define the Client Secret for the Management API
   */
  reach5ManagementClientSecret: string;

  /**
   * Space-delimited list of Management permissions.
   */
  reach5ManagementScope: string;

  /**
   * ReachFive JSON which contains fields to synchronize and mapping between SFCC and ReachFive profile fields
   */
  reach5ProfileFieldsJSON: string;

  /**
   * Supported ReachFive LanguageCodes. They set the language of ReachFive Form. The language lowercase ISO 639-1 codes. e.g: en, es, fr, it, nl ...
   */
  reach5SupportedLanguageCodes: string[];

  /**
   * ReachFive Web UI SDK Url.
   */
  reach5UiSdkUrl: string;

  /**
   * Authorize the automatical synchronization of Reachfive
   */
  ReachfiveAuthorizeSync: string;

  /**
   * Authentication method used to validate profile updates
   */
  reachFiveCheckCredentials: "none" | "password";

  /**
   * Name of the provider displayed in the External Profile in SFCC
   */
  reachFiveProviderId: string;

  /**
   * Duration of the Transition cookie in days. Required to identify the user already migrated to ReachFive.
   */
  reachFiveTransitionCookieDuration: number;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showPasswordReset.html )
   */
  "reset-password": string;

  /**
   * Define widget options (described here: https://developer.reachfive.com/sdk-ui/showSocialAccounts.html ) ; This widget can be found in My Account dashboard
   */
  "social-accounts-container": string;
}
/**
 * Custom attributes for AbstractItem object.
 */
declare class AbstractItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for AbstractItemCtnr object.
 */
declare class AbstractItemCtnrCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ActiveData object.
 */
declare class ActiveDataCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Appeasement object.
 */
declare class AppeasementCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for AppeasementItem object.
 */
declare class AppeasementItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Basket object.
 */
declare class BasketCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for BonusDiscountLineItem object.
 */
declare class BonusDiscountLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Campaign object.
 */
declare class CampaignCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Catalog object.
 */
declare class CatalogCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Category object.
 */
declare class CategoryCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CategoryAssignment object.
 */
declare class CategoryAssignmentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Content object.
 */
declare class ContentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ContentSearchRefinementDefinition object.
 */
declare class ContentSearchRefinementDefinitionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CouponLineItem object.
 */
declare class CouponLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomObject object.
 */
declare class CustomObjectCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerActiveData object.
 */
declare class CustomerActiveDataCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerAddress object.
 */
declare class CustomerAddressCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerGroup object.
 */
declare class CustomerGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerPaymentInstrument object.
 */
declare class CustomerPaymentInstrumentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for EncryptedObject object.
 */
declare class EncryptedObjectCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Folder object.
 */
declare class FolderCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for GiftCertificate object.
 */
declare class GiftCertificateCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for GiftCertificateLineItem object.
 */
declare class GiftCertificateLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Invoice object.
 */
declare class InvoiceCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for InvoiceItem object.
 */
declare class InvoiceItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Library object.
 */
declare class LibraryCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for LineItem object.
 */
declare class LineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for LineItemCtnr object.
 */
declare class LineItemCtnrCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Order object.
 */
declare class OrderCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for OrderAddress object.
 */
declare class OrderAddressCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for OrderPaymentInstrument object.
 */
declare class OrderPaymentInstrumentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for OrganizationPreferences object.
 */
declare class OrganizationPreferencesCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentCard object.
 */
declare class PaymentCardCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentInstrument object.
 */
declare class PaymentInstrumentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentMethod object.
 */
declare class PaymentMethodCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentProcessor object.
 */
declare class PaymentProcessorCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentTransaction object.
 */
declare class PaymentTransactionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PriceAdjustment object.
 */
declare class PriceAdjustmentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PriceBook object.
 */
declare class PriceBookCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Product object.
 */
declare class ProductCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductActiveData object.
 */
declare class ProductActiveDataCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductInventoryList object.
 */
declare class ProductInventoryListCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductInventoryRecord object.
 */
declare class ProductInventoryRecordCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductLineItem object.
 */
declare class ProductLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductList object.
 */
declare class ProductListCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListItem object.
 */
declare class ProductListItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListItemPurchase object.
 */
declare class ProductListItemPurchaseCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListRegistrant object.
 */
declare class ProductListRegistrantCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductOption object.
 */
declare class ProductOptionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductOptionValue object.
 */
declare class ProductOptionValueCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductSearchRefinementDefinition object.
 */
declare class ProductSearchRefinementDefinitionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductShippingLineItem object.
 */
declare class ProductShippingLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Promotion object.
 */
declare class PromotionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Recommendation object.
 */
declare class RecommendationCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Request object.
 */
declare class RequestCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Return object.
 */
declare class ReturnCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ReturnCase object.
 */
declare class ReturnCaseCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ReturnCaseItem object.
 */
declare class ReturnCaseItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ReturnItem object.
 */
declare class ReturnItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for SearchRefinementDefinition object.
 */
declare class SearchRefinementDefinitionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ServiceConfig object.
 */
declare class ServiceConfigCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ServiceCredential object.
 */
declare class ServiceCredentialCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ServiceProfile object.
 */
declare class ServiceProfileCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Session object.
 */
declare class SessionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Shipment object.
 */
declare class ShipmentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ShippingLineItem object.
 */
declare class ShippingLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ShippingMethod object.
 */
declare class ShippingMethodCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ShippingOrder object.
 */
declare class ShippingOrderCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ShippingOrderItem object.
 */
declare class ShippingOrderItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for SourceCodeGroup object.
 */
declare class SourceCodeGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Store object.
 */
declare class StoreCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for StoreGroup object.
 */
declare class StoreGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for TrackingInfo object.
 */
declare class TrackingInfoCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Variant object.
 */
declare class VariantCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for VariationGroup object.
 */
declare class VariationGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}
