const chai = require('chai');
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

const expect = chai.expect;

function SecureRandomStub() {}
SecureRandomStub.prototype.nextInt = function (bound) {
    return Math.floor(Math.random() * bound);
};

describe('technicalPassword', function () {
    let isAcceptablePassword;
    let technicalPassword;

    beforeEach(function () {
        isAcceptablePassword = sinon.stub().returns(true);
        technicalPassword = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/util/technicalPassword', {
            'dw/crypto/SecureRandom': SecureRandomStub,
            'dw/customer/CustomerMgr': { isAcceptablePassword: isAcceptablePassword }
        });
    });

    it('should generate 24 characters with an uppercase letter, a lowercase letter, a digit and a special character', function () {
        for (let i = 0; i < 500; i++) {
            const password = technicalPassword.generate();

            expect(password).to.have.lengthOf(24);
            expect(password).to.match(/[A-Z]/);
            expect(password).to.match(/[a-z]/);
            expect(password).to.match(/[0-9]/);
            expect(password).to.match(/[^A-Za-z0-9]/);
        }
    });

    it('should return the first password accepted by the site password policy', function () {
        isAcceptablePassword.onFirstCall().returns(false);
        isAcceptablePassword.onSecondCall().returns(true);

        const password = technicalPassword.generate();

        expect(isAcceptablePassword.calledTwice).to.equal(true);
        expect(isAcceptablePassword.secondCall.args[0]).to.equal(password);
    });

    it('should throw after 5 passwords rejected by the site password policy', function () {
        isAcceptablePassword.returns(false);

        expect(function () { technicalPassword.generate(); }).to.throw('site password policy');
        expect(isAcceptablePassword.callCount).to.equal(5);
    });
});
