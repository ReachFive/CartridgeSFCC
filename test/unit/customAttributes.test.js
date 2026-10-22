var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

var expect = chai.expect;

describe('customAttributes', function () {
    var warn;
    var customAttributes;

    beforeEach(function () {
        warn = sinon.spy();
        customAttributes = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/util/customAttributes', {
            'dw/system/Logger': { getLogger: function () { return { warn: warn }; } }
        });
    });

    describe('getCustomAttribute', function () {
        it('should return the value of a declared attribute', function () {
            var profile = { custom: { reachfiveHasTechnicalPassword: true } };

            expect(customAttributes.getCustomAttribute(profile, 'reachfiveHasTechnicalPassword')).to.equal(true);
        });

        it('should return null for an attribute that is not declared', function () {
            var profile = { custom: {} };
            Object.defineProperty(profile.custom, 'reachfiveHasTechnicalPassword', {
                get: function () { throw new ReferenceError('Unknown dynamic property'); }
            });

            expect(customAttributes.getCustomAttribute(profile, 'reachfiveHasTechnicalPassword')).to.equal(null);
        });

        it('should return null for a declared attribute without a value, even if `in` is false', function () {
            // A real custom attributes object answers false to `in` for a declared attribute without a value.
            var profile = { custom: new Proxy({}, { has: function () { return false; }, get: function () { return null; } }) };

            expect(customAttributes.getCustomAttribute(profile, 'reachfiveHasTechnicalPassword')).to.equal(null);
        });

        it('should return null when there is no object', function () {
            expect(customAttributes.getCustomAttribute(null, 'reachfiveHasTechnicalPassword')).to.equal(null);
        });
    });

    describe('setCustomAttribute', function () {
        it('should store the value of a declared attribute', function () {
            var profile = { custom: { reachfiveHasTechnicalPassword: null } };

            var stored = customAttributes.setCustomAttribute(profile, 'reachfiveHasTechnicalPassword', true);

            expect(stored).to.equal(true);
            expect(profile.custom.reachfiveHasTechnicalPassword).to.equal(true);
            expect(warn.called).to.equal(false);
        });

        it('should store the value of a declared attribute without a value, even if `in` is false', function () {
            var stored = {};
            var profile = {
                custom: new Proxy(stored, {
                    has: function () { return false; },
                    set: function (target, key, value) { target[key] = value; return true; }
                })
            };

            expect(customAttributes.setCustomAttribute(profile, 'reachfiveHasTechnicalPassword', true)).to.equal(true);
            expect(stored.reachfiveHasTechnicalPassword).to.equal(true);
            expect(warn.called).to.equal(false);
        });

        it('should not store anything and should warn for an attribute that is not declared', function () {
            var profile = {
                custom: new Proxy({}, {
                    set: function () { throw new ReferenceError('Unknown dynamic property'); }
                })
            };

            var stored = customAttributes.setCustomAttribute(profile, 'reachfiveHasTechnicalPassword', true);

            expect(stored).to.equal(false);
            expect(warn.calledOnce).to.equal(true);
        });
    });
});
