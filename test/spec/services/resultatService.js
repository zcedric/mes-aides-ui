'use strict';

describe('ResultatService', function () {
    var service, droits, situation, openfiscaResult, DROITS_DESCRIPTION;

    beforeEach(function() {
        module('ddsApp');
        inject(function(ResultatService, droitsDescription)
        {
            service = ResultatService;
            DROITS_DESCRIPTION = droitsDescription;
            DROITS_DESCRIPTION.prestationsNationales.assurance_retraite.prestations.private_aid = {
                private: true
            };
        });

        situation = {
            dateDeValeur: '2014-11-01',
            individus: [{
                aah: {
                    '2014-11': 100
                },
                aide_logement: {
                    '2014-11': 100
                }
            }, {
                ppa: {
                    '2014-11': 100
                }
            }]
        };

        openfiscaResult = {
            familles: {
                _: {
                    rsa_non_calculable: {
                        '2014-11': 'error'
                    },
                    paris_logement_familles: {
                        '2014-11': 10
                    },
                    private_aid: {
                        '2014-11': 10
                    }
                }
            },
            menages: {
                _: {
                    personne_de_reference: ['demandeur'],
                    depcom: {
                        '2014-11': '00000'
                    },
                }
            },
            individus: {
                demandeur: {
                    acs: {
                        '2014-11':100.25
                    },
                    cmu_c: {
                        '2014-11': false
                    }
                }
            }
        };
    });

    describe('_computeAides injected values', function() {
        beforeEach(function() {
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should extract injected droits', function() {
            expect(droits.droitsInjectes).toContain(DROITS_DESCRIPTION.prestationsNationales.caf.prestations.aah);
            expect(droits.droitsInjectes).toContain(DROITS_DESCRIPTION.prestationsNationales.caf.prestations.aide_logement);
            expect(droits.droitsInjectes).toContain(DROITS_DESCRIPTION.prestationsNationales.caf.prestations.ppa);
        });

        it('should not have injected droits duplicates', function() {
            expect(droits.droitsInjectes.filter(function(d) { return d.label == "Allocation aux adultes handicapés"; }).length).toEqual(1);
        });
    });

    describe('_computeAides of numeric value', function() {
        beforeEach(function() {
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should extract eligibles droits from openfisca result', function() {
            expect(droits.droitsEligibles.prestationsNationales.acs).toBeTruthy();
            expect(droits.droitsEligibles.prestationsNationales.acs.montant).toEqual(100);
            expect(droits.droitsEligibles.prestationsNationales.acs.provider.label).toEqual('Assurance maladie');

            expect(droits.droitsEligibles.partenairesLocaux[0].label).toEqual('Ville de Paris');
            expect(droits.droitsEligibles.partenairesLocaux[0].prestations.paris_logement_familles).toBeTruthy();
            expect(droits.droitsEligibles.partenairesLocaux[0].prestations.paris_logement_familles.montant).toEqual(10);

            expect(droits.droitsNonEligibles.prestationsNationales.cmu_c).toBeTruthy();
            expect(droits.droitsNonEligibles.prestationsNationales.cmu_c.montant).toBeFalsy();
            expect(droits.droitsNonEligibles.prestationsNationales.cmu_c.provider.label).toEqual('Assurance maladie');
        });
    });

    describe('_computeAides of true boolean values', function() {
        beforeEach(function() {
            openfiscaResult.individus.demandeur.cmu_c['2014-11'] = true;
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should extract eligibles droits from openfisca result', function() {
            expect(droits.droitsEligibles.prestationsNationales.cmu_c).toBeTruthy();
            expect(droits.droitsEligibles.prestationsNationales.cmu_c.montant).toBeTruthy();
        });
    });

    describe('_computeAides uncomputability highlighted', function() {
        beforeEach(function() {
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should extract reason of uncomputability', function() {
            expect(droits.droitsEligibles.prestationsNationales.rsa.montant).toEqual('error');
        });
    });

    describe('_computeAides extraction of local partenaire without prestation', function() {
        beforeEach(function() {
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should exclude local partenaire without prestation', function() {
            expect(droits.droitsEligibles.partenairesLocaux.filter(function(p) { return p.label == "Rennes Métropole"; }).length).toBeFalsy();
        });
    });

    describe('_computeAides exclude private aids', function() {
        beforeEach(function() {
            droits = service._computeAides(situation, openfiscaResult);
        });

        it('should exclude private aid', function() {
            expect(droits.droitsEligibles.prestationsNationales.private_aid).toBeFalsy();
        });
    });

    describe('round', function() {
        it('should not round for type "bool"', function() {
            expect(service.round(true, { type: 'bool' })).toEqual(true);
        });

        it('should floor for unit "%"', function() {
            expect(service.round(10.25, { unit: '%' })).toEqual(10);
            expect(service.round(10.2499, { unit: '%', floorAt: 0.01 })).toEqual(10.24);
        });

        it('should floor to lower 10s', function() {
            expect(service.round(132.17, { floorAt: 10 })).toEqual(130);
            expect(service.round(135, { floorAt: 10 })).toEqual(130);
            expect(service.round(139.47, { floorAt: 10 })).toEqual(130);
            expect(service.round(139.7, { floorAt: 10 })).toEqual(130);
        });

        it('should floor to lower cent', function() {
            expect(service.round(132.1789, { floorAt: 0.01 })).toBeCloseTo(132.17);
            expect(service.round(135, { floorAt: 0.01 })).toEqual(135);
            expect(service.round(139.0001, { floorAt: 0.01 })).toEqual(139.00);
        });

        it('should floor to lower integer by default', function() {
            expect(service.round(132.17, {})).toEqual(132);
            expect(service.round(135, {})).toEqual(135);
            expect(service.round(139.47, {})).toEqual(139);
        });
    });
});
