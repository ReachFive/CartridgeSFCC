const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const expect = chai.expect;

describe('ReachfiveProfile', function () {
    let ReachfiveProfile;

    beforeEach(function () {
        /**
         * Stub of the base profile model.
         * @param {Object} profile Profile
         */
        function BaseProfile(profile) {
            this.profile = profile;
        }
        ReachfiveProfile = proxyquire('../../cartridges/int_reachfive/cartridge/models/profile/reachfiveOrigin', {
            '~/cartridge/models/profile/base': BaseProfile
        });
    });

    it('should keep the profile it is created from', function () {
        const profile = { given_name: 'Jane', has_password: false };

        expect(new ReachfiveProfile(profile).profile).to.equal(profile);
    });

    describe('getSocialIdentities', function () {
        it('should return the identities with a user ID, except the local and lite ones', function () {
            const kakao = { provider: 'kakaotalk', user_id: '123' };
            const profile = new ReachfiveProfile({
                identities: [kakao, { provider: 'local', user_id: '456' }, { provider: 'lite', user_id: '789' }, { provider: 'google' }]
            });

            expect(profile.getSocialIdentities()).to.deep.equal([kakao]);
        });

        it('should return no identity for a profile without identities', function () {
            expect(new ReachfiveProfile({}).getSocialIdentities()).to.deep.equal([]);
            expect(new ReachfiveProfile(null).getSocialIdentities()).to.deep.equal([]);
        });
    });
});
