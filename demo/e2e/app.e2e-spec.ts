import { StateStoreLibraryDemoPage } from './app.po';

describe('state-store-library-demo App', () => {
  let page: StateStoreLibraryDemoPage;

  beforeEach(() => {
    page = new StateStoreLibraryDemoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
