import Ember from 'ember';
import { task } from 'ember-concurrency';

const { service } = Ember.inject;

export default Ember.Component.extend({
  ajax: service(),

  classNames: ['trigger-build-modal'],

  triggerBuildBranch: '',
  triggerBuildMessage: '',
  triggerBuildConfig: '',

  afterTriggerState: false,
  triggeredBuildId: false,
  jsonError: false,

  branches: Ember.computed.filterBy('repo.branches', 'exists_on_github', true),

  didReceiveAttrs() {
    this._super(...arguments);
    this.set('triggerBuildBranch', this.get('repo.defaultBranch.name'));
  },

  sanitizeConfig(config) {
    let double = config.replace(new RegExp('\'', 'g'), '"');
    return JSON.parse(double);
  },

  validateConfig() {
    let config = this.get('triggerBuildConfig');
    this.set('jsonError', false);

    try {
      return this.sanitizeConfig(config);
    } catch (e) {
      this.set('jsonError', true);
      return false;
    }
  },

  sendTriggerRequest: task(function* () {
    let config = this.validateConfig();

    if (config) {
      let body = {
        request: {
          branch: this.get('triggerBuildBranch'),
          config: config
        }
      };

      if (! Ember.isEmpty(this.get('triggerBuildMessage'))) {
        body.request.message = this.get('triggerBuildMessage');
      }

      try {
        yield this.get('ajax').postV3(`/repo/${this.get('repo.id')}/requests`, body)
          .then((data) => {
            this.set('afterTriggerStatus', 'Build request was sent, waiting to hear back.');
            let reqId = data.request.id;

            Ember.run.later(this, function () {
              this.get('ajax')
                .ajax(`/repo/${this.get('repo.id')}/request/${reqId}`, 'GET',
                      { headers: { 'Travis-API-Version': '3' } })
                .then((data) => {
                  let reqResult = data.result;
                  let triggeredBuild = data.builds[0];

                  if (reqResult === 'approved') {
                    this.set('afterTriggerStatus', `Your request was ${reqResult}.`);
                    this.set('triggeredBuildId', triggeredBuild.id);
                  } else if (reqResult === 'rejected') {
                    this.set('afterTriggerStatus', `Your request was ${reqResult}.`);
                  } else { // pending etc
                    this.set('afterTriggerStatus', 'Your request was not ready yet.');
                  }
                });
            }, 2000);
          });
      } catch (e) {
        this.set('afterTriggerStatus',
                 'Your build request didn\'t get through. Please try again later');
        Ember.run.later(this, this.get('onClose'), 3000);
      }
    }
  }),

  actions: {
    triggerCustomBuild() {
      this.get('sendTriggerRequest').perform();
    },
    toggleTriggerBuildModal() {
      this.get('onClose')();
    },
    validateConfig() {
      this.validateConfig();
    }
  }
});
