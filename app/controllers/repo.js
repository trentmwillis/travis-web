import Ember from 'ember';
import eventually from 'travis/utils/eventually';
import Visibility from 'npm:visibilityjs';
import config from 'travis/config/environment';

const { service, controller } = Ember.inject;
const { alias } = Ember.computed;

export default Ember.Controller.extend({
  updateTimesService: service('updateTimes'),
  popup: service(),

  jobController: controller('job'),
  buildController: controller('build'),
  buildsController: controller('builds'),
  reposController: controller('repos'),
  repos: alias('reposController.repos'),
  currentUser: alias('auth.currentUser'),

  classNames: ['repo'],

  build: Ember.computed.alias('buildController.build'),
  builds: Ember.computed.alias('buildsController.content'),
  job: Ember.computed.alias('jobController.job'),

  isShowingTriggerBuildModal: false,
  isShowingStatusBadgeModal: false,

  reset() {
    this.set('repo', null);
  },

  isEmpty: Ember.computed('repos.isLoaded', 'repos.length', function () {
    return this.get('repos.isLoaded') && this.get('repos.length') === 0;
  }),

  // @TODO fix this copy pasta :/
  branches: Ember.computed('popupName', 'repo', function () {
    let repoId = this.get('repo.id');

    let array = Ember.ArrayProxy.create({ content: [] }),
      apiEndpoint = config.apiEndpoint,
      options = {
        headers: {
          'Travis-API-Version': '3'
        }
      };

    if (this.get('auth.signedIn')) {
      options.headers.Authorization = `token ${this.auth.token()}`;
    }

    let url = `${apiEndpoint}/repo/${repoId}/branches?limit=100`;
    Ember.$.ajax(url, options).then(response => {
      if (response.branches.length) {
        let branchNames = response.branches.map(branch => branch.name);
        array.pushObjects(branchNames);
      } else {
        array.pushObject('master');
      }
    });

    return array;
  }),

  actions: {
    toggleStatusBadgeModal() {
      this.toggleProperty('isShowingStatusBadgeModal');
    },
    toggleTriggerBuildModal() {
      this.toggleProperty('isShowingTriggerBuildModal');
    }
  },

  init() {
    this._super(...arguments);
    if (!Ember.testing) {
      Visibility.every(this.config.intervals.updateTimes, this.updateTimes.bind(this));
    }
  },

  updateTimes() {
    let updateTimesService = this.get('updateTimesService');

    updateTimesService.push(this.get('build'));
    updateTimesService.push(this.get('builds'));
    updateTimesService.push(this.get('build.jobs'));
  },

  deactivate() {
    return this.stopObservingLastBuild();
  },

  activate(action) {
    this.stopObservingLastBuild();
    return this[('view_' + action).camelize()]();
  },

  viewIndex() {
    this.observeLastBuild();
    return this.connectTab('current');
  },

  viewCurrent() {
    this.observeLastBuild();
    return this.connectTab('current');
  },

  viewBuilds() {
    return this.connectTab('builds');
  },

  viewPullRequests() {
    return this.connectTab('pull_requests');
  },

  viewBranches() {
    return this.connectTab('branches');
  },

  viewBuild() {
    return this.connectTab('build');
  },

  viewJob() {
    return this.connectTab('job');
  },

  viewRequests() {
    return this.connectTab('requests');
  },

  viewCaches() {
    return this.connectTab('caches');
  },

  viewRequest() {
    return this.connectTab('request');
  },

  viewSettings() {
    return this.connectTab('settings');
  },

  currentBuildDidChange() {
    return Ember.run.scheduleOnce('actions', this, this._currentBuildDidChange);
  },

  _currentBuildDidChange() {
    let currentBuild = this.get('repo.currentBuild');
    if (currentBuild && currentBuild.get('id')) {
      eventually(currentBuild, (build) => {
        this.set('build', build);

        if (build.get('jobs.length') === 1) {
          this.set('job', build.get('jobs.firstObject'));
        }
      });
    }
  },

  stopObservingLastBuild() {
    return this.removeObserver('repo.currentBuild', this, 'currentBuildDidChange');
  },

  observeLastBuild() {
    this.currentBuildDidChange();
    return this.addObserver('repo.currentBuild', this, 'currentBuildDidChange');
  },

  connectTab(tab) {
    tab === 'current' ? 'build' : tab;
    return this.set('tab', tab);
  },
});
