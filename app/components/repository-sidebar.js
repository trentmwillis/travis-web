import Ember from 'ember';
import Visibility from 'npm:visibilityjs';
import { task } from 'ember-concurrency';

const { service } = Ember.inject;
const { alias } = Ember.computed;

export default Ember.Component.extend({
  tabStates: service(),
  ajax: service(),
  updateTimesService: service('updateTimes'),
  repositories: service(),
  store: service(),
  auth: service(),
  router: service(),

  didReceiveAttrs() {
    if (this.get('repositories.searchQuery')) {
      this.viewSearch();
    } else {
      this.get('viewOwned').perform();
    }
  },

  actions: {
    showRunningJobs: function () {
      this.get('tabStates').set('sidebarTab', 'running');
    },

    showMyRepositories: function () {
      this.set('tabStates.sidebarTab', 'owned');
      this.attrs.showRepositories();
    },

    onQueryChange(query) {
      if (query === '' || query === this.get('repositories.searchQuery')) { return; }
      this.set('repositories.searchQuery', query);
      this.get('repositories.showSearchResults').perform();
    }
  },

  allJobsCount: Ember.computed('runningJobs.length', 'queuedJobs.length', function () {
    return this.get('runningJobs.length') + this.get('queuedJobs.length');
  }),

  init() {
    this._super(...arguments);
    if (!Ember.testing) {
      Visibility.every(this.config.intervals.updateTimes, this.updateTimes.bind(this));
    }
  },

  runningJobs: Ember.computed('features.proVersion', function () {
    if (!this.get('features.proVersion')) { return []; }
    let result;

    let runningStates = ['queued', 'started', 'received'];
    result = this.get('store').filter('job', {}, job => runningStates.includes(job.get('state')));

    result.then(() => result.set('isLoaded', true));

    return result;
  }),

  queuedJobs: Ember.computed('features.proVersion', function () {
    if (!this.get('features.proVersion')) { return []; }

    const queuedStates = ['created'];
    let result = this.get('store').filter('job', job => queuedStates.includes(job.get('state')));
    result.set('isLoaded', false);
    result.then(() => result.set('isLoaded', true));

    return result;
  }),

  updateTimes() {
    let records = this.get('repos');

    let callback = (record) => record.get('currentBuild');
    records = records.filter(callback).map(callback);

    this.get('updateTimesService').push(records);
  },

  viewOwned: task(function* () {
    const ownedRepositories = yield this.get('repositories.requestOwnedRepositories').perform();

    if (this.get('auth.signedIn') && Ember.isEmpty(ownedRepositories)) {
      this.get('router').transitionTo('getting_started');
    }
  }),

  viewSearch() {
    return this.get('repositories.performSearchRequest').perform();
  },

  noReposMessage: Ember.computed('tab', function () {
    const tab = this.get('tab');
    if (tab === 'owned') {
      return 'You don\'t have any repos set up on Travis CI';
    } else if (tab === 'recent') {
      return 'Repositories could not be loaded';
    } else {
      return 'Could not find any repos';
    }
  }),

  showRunningJobs: Ember.computed('tabStates.sidebarTab', function () {
    return this.get('tabStates.sidebarTab') === 'running';
  }),

  repos: alias('repositories.accessible')
});
