'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock des modules Demandware
const Logger = require('dw-api-mock/dw/system/Logger');
const Status = require('dw-api-mock/dw/system/Status');

describe('reachFiveSynchronization', function () {
    let loggerStub;
    let customerMgrStub;
    let calendarStub;
    let reachFiveHelperStub;
    let libReachFiveSynchronizationStub;
    let reachFiveServiceInterfaceStub;
    let reachFiveSynchronization;

    beforeEach(function () {
        // Mock des modules Demandware
        loggerStub = {
            error: sinon.stub(), // console.error,
            warn: sinon.stub()
        };
        customerMgrStub = {
            searchProfiles: sinon.stub()
        };
        calendarStub = function () {
            this.add = sinon.stub();
            this.time = new Date();
        };
        reachFiveHelperStub = {
            getReachFiveProfileFieldsJSON: sinon.stub(),
            getReachFiveExternalID: sinon.stub()
        };
        libReachFiveSynchronizationStub = {
            cleanUpProfileErrorAttr: sinon.stub(),
            sendVerificationEmail: sinon.stub(),
            sendVerificationPhone: sinon.stub(),
            updatePhoneAndEmail: sinon.stub(),
            updateProfile: sinon.stub()
        };
        reachFiveServiceInterfaceStub = {
            generateTokenForManagementAPI: sinon.stub(),
            getUserFields: sinon.stub()
        };

        sinon.stub(Logger, 'getLogger').returns(loggerStub);

        // Import du fichier à tester avec les mocks
        reachFiveSynchronization = proxyquire(
            '../../../cartridges/int_reachfive/cartridge/scripts/job/reachFiveSynchronization',
            {
                'dw/system/Logger': {
                    getLogger: () => loggerStub
                },
                'dw/system/Status': Status,
                'dw/customer/CustomerMgr': customerMgrStub,
                'dw/util/Calendar': calendarStub,
                'int_reachfive/cartridge/scripts/helpers/reachFiveHelper':
                    reachFiveHelperStub,
                'int_reachfive/cartridge/scripts/helpers/reachFiveSynchronization':
                    libReachFiveSynchronizationStub,
                'int_reachfive/cartridge/scripts/interfaces/reachFiveInterface':
                    reachFiveServiceInterfaceStub
            }
        );
    });

    afterEach(function () {
        Logger.getLogger.restore();
    });

    it('should return error status if profile fields are missing', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.throws(
            'Error - "reach5ProfileFieldsJSON" Site Preference is missing'
        );
        const result = reachFiveSynchronization.beforeStep();
        expect(result).to.deep.equal(new Status(Status.ERROR));
    });

    it('should return error status if management token call fails', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: false,
            errorMessage: 'mockError'
        });
        customerMgrStub.searchProfiles.returns({
            hasNext: sinon.stub().returns(true)
        });
        const result = reachFiveSynchronization.beforeStep();
        expect(result).to.deep.equal(new Status(Status.ERROR));
    });

    it('should return OK status if everything is fine', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true
        });
        customerMgrStub.searchProfiles.returns({
            hasNext: sinon.stub().returns(false)
        });
        const result = reachFiveSynchronization.beforeStep();
        expect(result).to.deep.equal(new Status(Status.OK));
    });

    it('should log an error if an exception occurs in beforeStep', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.throws(
            new Error('mockError')
        );
        const result = reachFiveSynchronization.beforeStep();
        expect(result).to.deep.equal(new Status(Status.ERROR));
        expect(loggerStub.error.calledOnce).to.equal(true);
    });

    it('should update profileIterator when beforeStep is called', function () {
        const profilesIteratorStub = {
            hasNext: sinon.stub().returns(true)
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true
        });

        reachFiveSynchronization.beforeStep();

        expect(customerMgrStub.searchProfiles.calledOnce).to.equal(true);
        expect(
            customerMgrStub.searchProfiles.calledWith(
                'lastModified >= {0}',
                'lastModified asc',
                sinon.match.string
            )
        ).to.equal(true);
        expect(profilesIteratorStub.hasNext.calledOnce).to.equal(true);
    });

    it('should return the total count of profiles', () => {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true
        });
        const profilesIteratorStub = {
            getCount: sinon.stub().returns(5),
            hasNext: sinon.stub().returns(true)
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        reachFiveSynchronization.beforeStep();
        const count = reachFiveSynchronization.getTotalCount();
        expect(count).to.equal(5);
    });

    it('should read the next profile', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true
        });
        const profilesIteratorStub = {
            hasNext: sinon.stub().returns(true), // onFirstCall().returns(true).onSecondCall().returns(false)
            next: sinon.stub().returns('mockProfile')
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        reachFiveSynchronization.beforeStep();
        const profile = reachFiveSynchronization.read();
        expect(profile).to.equal('mockProfile');
    });

    it('should return null if no more profiles to read', function () {
        const profilesIteratorStub = {
            hasNext: sinon.stub().returns(false)
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        reachFiveSynchronization.beforeStep();
        const profile = reachFiveSynchronization.read();
        expect(profile).to.equal(null);
    });

    it('should process the profile and return OK status', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true,
            token: 'some_token'
        });
        const profilesIteratorStub = {
            hasNext: sinon
                .stub()
                .onFirstCall()
                .returns(true)
                .onSecondCall()
                .returns(false),
            next: sinon.stub().returns('mockProfile')
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        const profileStub = {
            custom: {
                reachfiveSendVerificationEmail: true,
                reachfiveSendVerificationPhone: true
            },
            getPhoneMobile: sinon.stub().returns('mockPhone'),
            getEmail: sinon.stub().returns('mockEmail')
        };
        reachFiveHelperStub.getReachFiveExternalID.returns('mockExternalID');
        reachFiveServiceInterfaceStub.getUserFields.returns({
            ok: true,
            object: { email: 'mockEmail', phone_number: 'mockPhone' }
        });
        reachFiveSynchronization.beforeStep();
        const result = reachFiveSynchronization.process(profileStub);
        expect(result).to.deep.equal(new Status(Status.OK));
    });

    it('should log an error if an exception occurs in process', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true,
            token: 'some_token'
        });
        const profilesIteratorStub = {
            hasNext: sinon
                .stub()
                .onFirstCall()
                .returns(true)
                .onSecondCall()
                .returns(false),
            next: sinon.stub().returns('mockProfile')
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        const profileStub = {
            custom: {
                reachfiveSendVerificationEmail: true,
                reachfiveSendVerificationPhone: true
            },
            getPhoneMobile: sinon.stub().returns('mockPhone'),
            getEmail: sinon.stub().returns('mockEmail')
        };
        reachFiveHelperStub.getReachFiveExternalID.throws(
            new Error('mockError')
        );
        const result = reachFiveSynchronization.process(profileStub);
        expect(result).to.deep.equal(new Status(Status.ERROR));
        expect(loggerStub.error.calledOnce).to.equal(true);
    });

    it('should close the profiles iterator', function () {
        reachFiveHelperStub.getReachFiveProfileFieldsJSON.returns('{}');
        reachFiveServiceInterfaceStub.generateTokenForManagementAPI.returns({
            ok: true,
            token: 'some_token'
        });
        const profilesIteratorStub = {
            hasNext: sinon
                .stub()
                .onFirstCall()
                .returns(true)
                .onSecondCall()
                .returns(false),
            next: sinon.stub().returns('mockProfile'),
            close: sinon.spy()
        };
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        customerMgrStub.searchProfiles.returns(profilesIteratorStub);
        reachFiveSynchronization.beforeStep();
        reachFiveSynchronization.afterStep();
        expect(profilesIteratorStub.close.calledOnce).to.equal(true);
    });
});
