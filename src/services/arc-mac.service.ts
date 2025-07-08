import {
  getSpaceNameById,
  getStorableSidebar,
  getStorableWindows,
  latestActiveWindow,
  parseSpacesData,
} from "../server/parse-arc";

export const getData = async () => {};

export class ArcMacService {
  private sidebar;
  private windows;
  private readyFlags = {
		getData: false
	};

  constructor() {
    this.getData().then(({ sidebar, windows }) => {
      this.sidebar = sidebar;
      this.windows = windows;

      this.readyFlags.getData = true;
    });
  }

  async isReady() {
    while (!this.readyFlags.getData) {
      await new Promise((res) => setTimeout(res, 100));

      return this.isReady();
    }

    return true;
  }

  async getData() {
    const sidebarPromise = getStorableSidebar();
    const windowsPromise = getStorableWindows();

    const [$sidebar, $windows] = await Promise.all([
      sidebarPromise,
      windowsPromise,
    ]);

    return {
      sidebar: $sidebar,
      windows: $windows.windows,
    };
  }

  async getLastActiveSpaceName() {
    await this.isReady();

    const spaces = await parseSpacesData(this.sidebar);
    const { focusedSpaceID } = latestActiveWindow(this.windows);

    return getSpaceNameById(spaces, focusedSpaceID);
  }
}
