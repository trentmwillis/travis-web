import Ember from 'ember';
import Config from 'travis/config/environment';

const { service } = Ember.inject;

export default Ember.Component.extend({
  auth: service(),
  externalLinks: service(),
  statusImages: service(),

  classNames: ['popup', 'status-images'],
  formats: ['Image URL', 'Markdown', 'Textile', 'Rdoc', 'AsciiDoc', 'RST', 'Pod', 'CCTray'],

  branches: Ember.computed('repo', function () {
    let repoId = this.get('repo.id');

    let array = Ember.ArrayProxy.create({ content: [] }),
      apiEndpoint = Config.apiEndpoint,
      options = {
        headers: {
          'Travis-API-Version': '3'
        }
      };

    array.set('isLoaded', false);

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

      array.set('isLoaded', true);
    });

    return array;
  }),

  statusString: Ember.computed('format', 'repo.slug', 'branch', function () {
    const format = this.get('format') || this.get('formats.firstObject');
    const branch = this.get('branch') || 'master';

    return this.formatStatusImage(format, this.get('repo.slug'), branch);
  }),

  formatStatusImage(format, slug, branch) {
    switch (format) {
      case 'Image URL':
        return this.get('statusImages').imageUrl(slug, branch);
      case 'Markdown':
        return this.get('statusImages').markdownImageString(slug, branch);
      case 'Textile':
        return this.get('statusImages').textileImageString(slug, branch);
      case 'Rdoc':
        return this.get('statusImages').rdocImageString(slug, branch);
      case 'AsciiDoc':
        return this.get('statusImages').asciidocImageString(slug, branch);
      case 'RST':
        return this.get('statusImages').rstImageString(slug, branch);
      case 'Pod':
        return this.get('statusImages').podImageString(slug, branch);
      case 'CCTray':
        return this.get('statusImages').ccXml(slug, branch);
    }
  },

  actions: {
    toggleStatusImageModal() {
      this.get('onClose')();
    }
  }
});
