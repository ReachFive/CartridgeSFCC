'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock des modules Demandware
const CustomerMgr = require('dw-api-mock/dw/customer/CustomerMgr');
const Transaction = require('dw-api-mock/dw/system/Transaction');
const Logger = require('dw-api-mock/dw/system/Logger');

describe('deleteUsers', function () {
    let profileIteratorStub;
    let customerProfileStub;
    let customerStub;
    let loggerStub;
    let deleteUsers;
    let reachFiveServiceInterface;
    let salesforceServiceInterface;

    beforeEach(function () {
        customerStub = {
            registered: true
        };

        customerProfileStub = {
            custom: {
                toDelete: true
            },
            getCustomer: sinon.stub().returns(customerStub),
            customerNo: 'mockCustomerNo'
        };

        profileIteratorStub = {
            hasNext: sinon.stub().onFirstCall().returns(true).onSecondCall()
                .returns(false),
            next: sinon.stub().returns(customerProfileStub)
        };

        sinon.stub(CustomerMgr, 'searchProfiles').returns(profileIteratorStub);
        loggerStub = {
            info: sinon.spy(),
            warn: sinon.spy(),
            error: sinon.spy()
        };
        sinon.stub(Logger, 'getLogger').returns(loggerStub);

        // Mock des interfaces de service
        reachFiveServiceInterface = {
            deleteUser: sinon.stub().returns({ ok: true })
        };
        salesforceServiceInterface = {
            deleteCustomerUsingOCAPI: sinon.stub().returns({ ok: true })
        };

        // Import du fichier à tester avec les mocks
        deleteUsers = proxyquire('../../../cartridges/int_reachfive/cartridge/scripts/job/deleteUsers', {
            'dw/customer/CustomerMgr': CustomerMgr,
            'dw/system/Transaction': Transaction,
            'dw/system/Logger': Logger,
            'int_reachfive/cartridge/scripts/interfaces/reachFiveInterface': reachFiveServiceInterface,
            'int_reachfive/cartridge/scripts/interfaces/salesforceInterface': salesforceServiceInterface
        });
    });

    afterEach(function () {
        CustomerMgr.searchProfiles.restore();
        Logger.getLogger.restore();
    });

    it('should delete users marked for deletion', function () {
        deleteUsers.execute();

        expect(CustomerMgr.searchProfiles.calledOnce).to.equal(true);
        expect(profileIteratorStub.hasNext.calledTwice).to.equal(true);
        expect(profileIteratorStub.next.calledOnce).to.equal(true);
        expect(customerProfileStub.getCustomer.calledOnce).to.equal(true);
        expect(reachFiveServiceInterface.deleteUser.calledOnceWith(customerProfileStub)).to.equal(true);
        expect(salesforceServiceInterface.deleteCustomerUsingOCAPI.calledOnceWith(customerStub)).to.equal(true);
    });

    it('should log a warning if deleting the profile on Reachfive fails', function () {
        reachFiveServiceInterface.deleteUser.returns({ ok: false });
        deleteUsers.execute();
        expect(loggerStub.warn.calledWith('Issue when deleting the profile on Reachfive: mockCustomerNo')).to.equal(true);
    });

    it('should log a warning if deleting the profile on SFCC fails', function () {
        salesforceServiceInterface.deleteCustomerUsingOCAPI.returns({ ok: false });

        deleteUsers.execute();

        expect(loggerStub.warn.calledWith('Issue when deleting the profile on SFCC : mockCustomerNo')).to.equal(true);
    });
});
