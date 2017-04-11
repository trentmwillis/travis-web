import { test } from 'qunit';
import moduleForAcceptance from 'travis/tests/helpers/module-for-acceptance';
import triggerBuildPage from 'travis/tests/pages/trigger-build';

moduleForAcceptance('Acceptance | repo/trigger build');

test('triggering a custom build via the dropdown', function (assert) {
  this.currentUser = server.create('user', {
    name: 'Ada Lovelace',
    login: 'adal',
    repos_count: 1
  });

  const repo = server.create('repository', {
    name: 'difference-engine',
    slug: 'adal/difference-engine'
  });

  const repoId = parseInt(repo.id);

  const defaultBranch = server.create('branch', {
    name: 'master',
    id: `/v3/repo/${repoId}/branch/master`,
    default_branch: true,
    exists_on_github: true,
    repository: repo
  });

  const latestBuild = defaultBranch.createBuild({
    state: 'passed',
    number: '1234',
    repository: repo
  });

  latestBuild.createCommit({
    sha: 'c0ffee'
  });

  repo.currentBuild = latestBuild;
  repo.save();

  triggerBuildPage.visit({ slug: repo.slug });

  andThen(() => {
    assert.equal(currentURL(), 'adal/difference-engine', 'we are on a repo page');
  });

  assert.ok(triggerBuildPage.popupIsHidden, 'modal is hidden');
  triggerBuildPage.openPopup();

  andThen(() => {
    assert.ok(triggerBuildPage.popupIsVisible, 'modal is visible after click');
  });

  triggerBuildPage.selectBranch('master');
  triggerBuildPage.writeMessage('This is a demo build');
  triggerBuildPage.writeConfig('This is invalid config');
  triggerBuildPage.triggerConfigValidation();

  andThen(() => {
    percySnapshot(assert);
    assert.ok(triggerBuildPage.submitButtonInactive, 'invalid config deactivates submit');
  });

  triggerBuildPage.writeConfig('{"script": "echo LOVELACE"}');
  triggerBuildPage.triggerConfigValidation();

  andThen(() => {
    assert.ok(triggerBuildPage.submitButtonActive, 'valid config activates submit');
  });

  triggerBuildPage.clickSubmit();

  andThen(() => {
    percySnapshot(assert);
    assert.ok(triggerBuildPage.submitIsHidden, 'after triggering the submit button is hidden');
    assert.ok(triggerBuildPage.noticeIsVisible, 'after triggering a notice appears');
  });
});
