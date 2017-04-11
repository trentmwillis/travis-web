import PageObject from 'travis/tests/page-object';

let {
  visitable,
  clickable,
  isHidden,
  isVisible,
  selectable,
  fillable,
  hasClass,
  triggerable
} = PageObject;

export default PageObject.create({
  visit: visitable(':slug'),
  popupIsHidden: isHidden('.trigger-build-modal'),
  openPopup: clickable('.option-dropdown .trigger-build-anchor'),
  popupIsVisible: isVisible('.trigger-build-modal'),
  selectBranch: selectable('#trigger-build-branches'),
  writeMessage: fillable('#trigger-build-message'),
  writeConfig: fillable('#trigger-build-config'),
  triggerConfigValidation: triggerable('keypress', '#trigger-build-config'),
  submitButtonInactive: hasClass('inactive', '.trigger-build-submit'),
  submitButtonActive: hasClass('button--blue', '.trigger-build-submit'),
  clickSubmit: clickable('.trigger-build-submit'),
  submitIsHidden: isHidden('.trigger-build-submit'),
  noticeIsVisible: isVisible('.trigger-build-modal .notice-banner--blue')
});
