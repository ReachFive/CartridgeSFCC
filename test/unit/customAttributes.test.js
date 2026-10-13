const chai = require('chai');
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

const expect = chai.expect;

describe('customAttributes', function () {
    let warn;
    let customAttributes;

    beforeEach(function () {
        warn = sinon.spy();
        customAttributes = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/util/customAttributes', {
            'dw/system/Logger': { getLogger: function () { return { warn: warn }; } }
        });
    });

    describe('getCustomAttribute', function () {
        it('should return the value of a declared attribute', function () {
            const profile = { custom: { reachfiveHasTechnicalPassword: true } };

            expect(customAttributes.getCustomAttribute(profile, 'reachfiveHasTechnicalPassword')).to.equal(true);
        });

        it('should return null for an attribute that is not declared', function () {
            const profile = { custom: {} };

            expect(customAttributes.getCustomAttribute(profile, 'reachfiveHasTechnicalPassword')).to.equal(null);
        });

        it('should return null when there is no object', function () {
            expect(customAttributes.getCustomAttribute(null, 'reachfiveHasTechnicalPassword')).to.equal(null);
        });
    });

    describe('setCustomAttribute', function () {
        it('should store the value of a declared attribute', function () {
            const profile = { custom: { reachfiveHasTechnicalPassword: null } };

            const stored = customAttributes.setCustomAttribute(profile, 'reachfiveHasTechnicalPassword', true);

            expect(stored).to.equal(true);
            expect(profile.custom.reachfiveHasTechnicalPassword).to.equal(true);
            expect(warn.called).to.equal(false);
        });

        it('should not store anything and should warn for an attribute that is not declared', function () {
            const profile = { custom: {} };

            const stored = customAttributes.setCustomAttribute(profile, 'reachfiveHasTechnicalPassword', true);

            expect(stored).to.equal(false);
            expect('reachfiveHasTechnicalPassword' in profile.custom).to.equal(false);
            expect(warn.calledOnce).to.equal(true);
        });
    });
});
