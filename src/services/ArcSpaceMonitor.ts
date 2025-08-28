import { measurePerformance } from "../utils/measure-performance";
import ActiveWindow, {
  type WindowInfo,
} from "./node-active-window/NodeActiveWindow";

type ListenerOptions = {
  updateArcSpaceOnChange?: boolean;
};

export class ArcSpaceMonitor {
  private getArcSpaceDebouncer: NodeJS.Timeout | null = null;

  private watcherId: number | undefined;

  public space: string | null = null;

  constructor() {
    ActiveWindow.initialize({ osxRunLoop: "all" });
    ActiveWindow.requestPermissions();
  }

  public listenForWindowsChange(options: ListenerOptions) {
    this.watcherId = ActiveWindow.subscribe(async (windowInfo) => {
      if (windowInfo == null) return null;

      if (options.updateArcSpaceOnChange) {
        if (this.getArcSpaceDebouncer) clearTimeout(this.getArcSpaceDebouncer);
        this.getArcSpaceDebouncer = setTimeout(async () => this.updateArcSpaceOnChange(windowInfo), 200);
      }
    });
  }

  public getActiveWindowSpace(): string | null {
    const space = ActiveWindow.getArcActiveSpace()

    if(!space || space.startsWith('error:')) return this.space

    return this.space = space
  }

  public gracefulShutDown(signal: string) {
    if (!this.watcherId) process.exit(0);

    console.log(`Received ${signal}. Shutting down gracefully...`);

    ActiveWindow.unsubscribe(this.watcherId);

    setTimeout(() => {
      console.error("Active window unsubscribed. Exiting.");
      process.exit(0);
    }, 300);
  }

  private async updateArcSpaceOnChange(windowInfo: WindowInfo) {
    if (windowInfo.application !== "Arc") return null;

    try {
      const space = await this.getActiveWindowSpace();

      this.space = space;
    } catch (e) {
      console.error(e);
    }
  }
}

export default ArcSpaceMonitor;
