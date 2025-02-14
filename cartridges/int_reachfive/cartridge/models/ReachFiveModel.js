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
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');

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
     * @return {dw.customer.Profile|null} true if operation succeeded
     * @param {string} externalID External Identifier
     * @param {Object} externalProfile External Profile Object
     * @param {Object} [reachFiveConsents] Consents Object from external Profile
     */
    createReachFiveCustomer: function (externalID, externalProfile, has_password, reachFiveConsents, data) {
		if (!externalID || !externalProfile) {
			return null;
		}
		// Begin Transaction before create customer
		Transaction.begin();

		try {
			//Create an internal profile linked to the customer in order to avoid the duplicate profiles
			if ( reachFiveHelper.isFieldExist(externalProfile, 'email') && reachfiveSettings.isReachFiveEmailAsLogin )
			{
				var temporaryPassword = Math.random().toString(36).substr(2, 8) + '!O)';

				var newCustomer = CustomerMgr.createCustomer(externalProfile.email, temporaryPassword);

				var Pipelet = require('dw/system/Pipelet');
				var PipeletPasswordGeneration = new dw.system.Pipelet('ResetCustomerPassword').execute({
				    Customer: newCustomer
				});

				var profile = newCustomer.getProfile();

				var credentials = profile.getCredentials();
				credentials.setAuthenticationProviderID(this.reachFiveProviderId);
				credentials.setExternalID(externalID);

				try {
					// we add email for this new external customer profile
					var externalCustomerProfile = newCustomer.getExternalProfile(this.reachFiveProviderId, externalID);
					externalCustomerProfile.setEmail(externalProfile.email);
				} catch (e) {
					LOGGER.debug('Error on added email to external profile {0}', e);	
				}
				
				LOGGER.info('Customer created with credentials and an external profile {0} with the external ID {1}', this.reachFiveProviderId, externalID);
			}
			else
			{
				// Create Externally customer
				var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(this.reachFiveProviderId, externalID);
				var profile = newCustomer.getProfile();

				LOGGER.info('Customer created with an external profile {0} with the external ID {1}', this.reachFiveProviderId, externalID);
			}

			if( !has_password ) {
				profile.custom.reachfiveHasTechnicalPassword = true;
			}
			// Complete customer's profile with firstname, lastname, email and birthday if exists

			if (reachFiveHelper.isFieldExist(externalProfile, 'given_name')) {
				profile.setFirstName(externalProfile.given_name);
			}

			if (reachFiveHelper.isFieldExist(externalProfile, 'family_name')) {
				profile.setLastName(externalProfile.family_name);
			}

      		if (reachFiveHelper.isFieldExist(externalProfile, 'phone_number')) {
				profile.setPhoneHome(externalProfile.phone_number);
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

			//Store the data from the beginning of the authentication flow
			if ( data != null ) {
				profile.custom.data = data;
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
     * @return {dw.customer.Customer|null} logged in customer or null
     */
    loginReachFiveCustomer: function (externalID, profile) {
		var credentials = profile.getCredentials();
        var currentcustomer = null;
		if (!credentials.isEnabled()) {
			LOGGER.warn('Customer attempting to login into a disabled profile: {0} with external id: {1}',
				profile.getCustomer().getCustomerNo(),
				externalID
			);
		} else {
            var reachFiveProviderId = this.reachFiveProviderId;
            Transaction.wrap(function () {
                currentcustomer = CustomerMgr.loginExternallyAuthenticatedCustomer(reachFiveProviderId, externalID, true);
            });

            if (currentcustomer) {
                reachFiveHelper.setReachFiveConversionCookie();
            }
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
