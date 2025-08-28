import type {
  Module,
  NativeWindowInfo,
  WindowInfo,
  IActiveWindow,
  InitializeOptions,
} from "./types";

const SUPPORTED_PLATFORMS = ["win32", "linux", "darwin"];

let addon: Module<NativeWindowInfo> | undefined;

if (SUPPORTED_PLATFORMS.includes(process.platform)) {
  addon = require("./build/Release/PaymoActiveWindow.node"); // eslint-disable-line import/no-dynamic-require
} else {
  throw new Error(
    `Unsupported platform. The supported platforms are: ${SUPPORTED_PLATFORMS.join(
      ",",
    )}`,
  );
}

export class NodeActiveWindow implements IActiveWindow {
  private options: InitializeOptions = {};

  private encodeWindowInfo(info: NativeWindowInfo): WindowInfo {
    return {
      title: info.title,
      application: info.application,
      path: info.path,
      pid: info.pid,
      ...(process.platform == "win32"
        ? {
            windows: {
              isUWPApp: info["windows.isUWPApp"] || false,
              uwpPackage: info["windows.uwpPackage"] || "",
            },
          }
        : {}),
    };
  }

  public initialize(options: InitializeOptions = {}): void {
    this.options = options;

    if (!addon) {
      throw new Error("Failed to load native addon");
    }

    if (addon.initialize) {
      addon.initialize();
    }

    // set up runloop on MacOS
    if (process.platform == "darwin" && this.options.osxRunLoop == "all") {
      const interval = setInterval(() => {
        if (addon && addon.runLoop) {
          addon.runLoop();
        } else {
          clearInterval(interval);
        }
      }, 100);
    }
  }

  public requestPermissions(): boolean {
    if (!addon) {
      throw new Error("Failed to load native addon");
    }

    if (
      !addon.hasAccessibilityPermission ||
      !addon.requestAccessibilityPermissions
    ) {
      throw new Error("Failed to load native addon");
    }

    // First check if we already have permissions
    const hasPermission = addon.hasAccessibilityPermission();
    console.log("Current accessibility permission:", hasPermission);

    if (!hasPermission) {
      console.log("Requesting accessibility permissions...");

      // Request permissions - this will show the system dialog
      const granted = addon.requestAccessibilityPermissions();

      if (!granted) {
        console.log("Permission not granted immediately.");
        console.log(
          "Please go to System Preferences > Security & Privacy > Privacy > Accessibility",
        );
        console.log("and enable access for this application.");

        // You might want to poll or ask user to refresh
        return false;
      }
    }

    return true;
  }

  public getActiveWindow(): WindowInfo {
    if (!addon) {
      throw new Error("Failed to load native addon");
    }

    // use runloop on MacOS if requested
    if (
      process.platform == "darwin" &&
      this.options.osxRunLoop &&
      addon.runLoop
    ) {
      addon.runLoop();
    }

    const info = addon.getActiveWindow();

    return this.encodeWindowInfo(info);
  }

  public getArcActiveSpace(): string {
    if (!addon) {
      throw new Error("Failed to load native addon");
    }
    if (addon.getArcActiveSpace) {
      return addon.getArcActiveSpace();
    }

    return "";
  }

  public subscribe(callback: (windowInfo: WindowInfo | null) => void): number {
    if (!addon) {
      throw new Error("Failed to load native addon");
    }

    const watchId = addon.subscribe((nativeWindowInfo) => {
      callback(
        !nativeWindowInfo ? null : this.encodeWindowInfo(nativeWindowInfo),
      );
    });

    return watchId;
  }

  public unsubscribe(watchId: number): void {
    if (!addon) {
      throw new Error("Failed to load native addon");
    }

    if (watchId < 0) {
      throw new Error("Watch ID must be a positive number");
    }

    addon.unsubscribe(watchId);
  }
}

const ActiveWindow = new NodeActiveWindow();

export * from "./types";
export default ActiveWindow;
