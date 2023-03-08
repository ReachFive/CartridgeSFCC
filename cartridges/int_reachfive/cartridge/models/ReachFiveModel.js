/* eslint-disable no-undef */
/* eslint-disable indent */
'use strict';
/**
 * Model for customer profiles ReachFive.
 * @module models/ReachFiveModel */

/**
 * API Includes
 *  */
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
// var Credentials = require('dw/customer/Credentials');
var Calendar = require('dw/util/Calendar');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * Reach Five Modules
 *  */
var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');

/**
 * ReachFive helper providing enhanced profile functionality
 * @class module:models/ReachFiveModel~ReachFiveModel
 */
var ReachFiveModel = ({
	/** @lends module:models/ReachFiveModel~ReachFiveModel.prototype */
	reachFiveProviderId: reachFiveHelper.getReachFiveProviderId(),

    /**
     * Create a new external customer with reach five provider ID and external ID
     *
     * @alias module:models/ReachFiveModel~ReachFiveModel/createReachFiveCustomer
     * @return {boolean} true if operation succeedeed
     * @param {string} externalID External Identifier
     * @param {Object} externalProfile External Profile Object
     * @param {Object} reachFiveConsents Consents Object from external Profile
     */
    createReachFiveCustomer: function (externalID, externalProfile, reachFiveConsents) {
		if (!externalID || !externalProfile) {
			return null;
		}
		// Begin Transaction before create customer
		Transaction.begin();

		try {
			// Create Externally customer
			customer = CustomerMgr.createExternallyAuthenticatedCustomer(this.reachFiveProviderId, externalID);
			var profile = customer.getProfile();

			// Complete customer's profile with firstname, lastname, email and birthday if exists
			if (reachFiveHelper.isFieldExist(externalProfile, 'given_name')) {
				profile.setFirstName(externalProfile.given_name);
			}

			if (reachFiveHelper.isFieldExist(externalProfile, 'family_name')) {
				profile.setLastName(externalProfile.family_name);
			}

			if (reachFiveHelper.isFieldExist(externalProfile, 'email')) {
				profile.setEmail(externalProfile.email);
			}

			if (reachFiveHelper.isFieldExist(externalProfile, 'birthdate')) {
				var c = new Calendar();
				c.parseByFormat(externalProfile.birthdate, 'yyyy-MM-dd');
				profile.setBirthday(c.getTime());
			}

			if (reachFiveHelper.isFieldExist(externalProfile, 'gender')) {
				var gender = externalProfile.gender;
				if (gender.equals('female')) {
					profile.setGender(2);
				} else if (gender.equals('male')) {
					profile.setGender(1);
				}
			}

            // TODO: Check this attribute "isNewsletter" looks like it is not used
            //       Also check it in system attributes
			if (reachFiveConsents && reachFiveConsents.newsletter) {
				profile.custom.isNewsletter = reachFiveConsents.newsletter.granted;
			}

            // Finish Transaction with success
			Transaction.commit();
			return profile;
		} catch (e) {
			Transaction.rollback();
			return null;
		}
    },

    /**
     * login a customer with reach five provider ID and external ID
     * @alias module:models/ReachFiveModel~ReachFiveModel/loginReachFiveCustomer
     * @param {string} externalID External ID
     * @param {dw.customer.Profile} profile Customer Profile Object
     * @param {string} email Customer Email
     * @return {dw.customer.Customer|null} logged in customer or null
     */
    loginReachFiveCustomer: function (externalID, profile, email) {
		var credentials = profile.getCredentials();
		if (!credentials.isEnabled()) {
			LOGGER.warn('Customer attempting to login into a disabled profile: {0} with external id: {1}',
				profile.getCustomer().getCustomerNo(),
				externalID
			);
			return null;
		}

        var currentcustomer = null;
        try {
			Transaction.begin();
			// Login customer
			currentcustomer = CustomerMgr.loginExternallyAuthenticatedCustomer(this.reachFiveProviderId, externalID, true);

			if (!empty(email)) {
				var customerCredential = currentcustomer.getProfile().getCredentials();
				var fakePassword = dw.web.Resource.msg('reachfive.temporarypassword', 'configuration', null);
				customerCredential.setPassword(fakePassword, fakePassword, false);
				customerCredential.setLogin(email, fakePassword);
				var passwordSecure = fakePassword + dw.util.UUIDUtils.createUUID();
				customerCredential.setPassword(passwordSecure, passwordSecure, false);
			}
			LOGGER.debug('Logged in external customer with id: {0}', externalID);
			Transaction.commit();
            reachFiveHelper.setReachFiveConversionCookie();
		} catch (e) {
			LOGGER.error('Logged in external customer with id: {0} failed with this exception : {1}', externalID, e);
			Transaction.rollback();
		}
        return currentcustomer;
    },

    /**
     * Set external parameters on customer's credentials
     *
     * @alias module:models/ReachFiveModel~ReachFiveModel/setExternalParams
     * @param {string} externalID Customer External ID
     * @param {dw.customer.Profile} profile Customer Profile Object
     * @return {boolean} true if operation succeedeed
     */
    setExternalParams: function (externalID, profile) {
		if (!externalID) {
			return false;
		}
		var credentials = profile.getCredentials();
		try {
			Transaction.begin();
			// Set the new provider ID and External ID
			credentials.setAuthenticationProviderID(this.reachFiveProviderId);
			credentials.setExternalID(externalID);
			LOGGER.debug('Modified customer {0} external parameters', externalID);
			Transaction.commit();
			return true;
		} catch (e) {
			LOGGER.error('set external paramaters on customer\'s credentials with id: {0} failed with this exception : {1}', externalID, e);
			Transaction.rollback();
			return false;
		}
    }
});

/**
 * Export ReachFiveModel
 * */
module.exports = ReachFiveModel;
