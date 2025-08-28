import os from "os";
import { readJsonFile } from "../utils/read-json-file";

type StorableSidebar = unknown

type StorableWindows = Record<string, unknown> & {
  windows: Record<string, unknown>[];
  lastFocusedSpaceID: string;
};

enum Confidence {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

type LastActiveSpace =  {
  name: string
  confidence: Confidence
}

interface Space {
  id: string;
  name?: string;
  lastChangeDate?: number;
}

interface Windows {
  activeWindowParsedByArc: Space; // Confidence is mid. It's what arc says was last used, after testing it showed not to be robust
  openWindows: Space[]; // Confidence is high
}

interface Profile {
  title: string;
  spaces: Space[];
}

export class ArcMacService {
  private readonly initializationPromise: Promise<void>;

  public sidebarArcData: unknown
  public windowsArcData: StorableWindows
  public spacesMap: Space[] = [];
  public profiles: Profile[];
  public windows: Windows;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    const sidebarPromise = this.getStorableSidebar();
    const windowsPromise = this.getStorableWindows();

    const [$sidebar, $windows] = await Promise.all([
      sidebarPromise,
      windowsPromise,
    ]);

    this.sidebarArcData = $sidebar;
    this.windowsArcData = $windows;

    // Respect this order of operations
    this.spacesMap = this.parseSpaces($sidebar);
    this.profiles = this.parseProfiles($sidebar);
    this.inferMissingSpaceNames();
    this.windows = this.parseWindows($windows); // Depends on parsed spaces
  }

  async isReady() {
    await this.initializationPromise;
    return true;
  }

  private getStorableSidebar = async () => {
    const { username } = os.userInfo();

    const path = `/Users/${username}/Library/Application Support/Arc/StorableSidebar.json`;

    return readJsonFile(path);
  };

  private getStorableWindows = async (): Promise<any> => {
    const { username } = os.userInfo();

    const path = `/Users/${username}/Library/Application Support/Arc/StorableWindows.json`;

    return readJsonFile(path);
  };

  private parseSpaces(jsonData: StorableSidebar): Space[] {
    const spaces: Space[] = [];

    if (jsonData === undefined) return spaces;
    const data = jsonData as Record<string, unknown>;

    // Check if sidebarSyncState exists and is an object
    if (!data.sidebarSyncState || typeof data.sidebarSyncState !== "object") {
      return spaces;
    }

    const sidebarSyncState = data.sidebarSyncState as Record<string, unknown>;
    const spaceModels = sidebarSyncState.spaceModels;

    if (!spaceModels || !Array.isArray(spaceModels)) {
      return spaces;
    }

    // The spaceModels array alternates between IDs (strings) and value objects
    for (let i = 0; i < spaceModels.length; i += 2) {
      const spaceId = spaceModels[i];
      const spaceWrapper = spaceModels[i + 1];

      if (typeof spaceId === "string" && spaceWrapper?.value) {
        const spaceValue = spaceWrapper.value;
        if (spaceValue.id && spaceValue.title) {
          const space: Space = {
            id: spaceValue.id,
            name: spaceValue.title,
          };

          spaces.push(space);
        }
      }
    }

    return spaces;
  }

  private parseWindows(jsonData: StorableWindows): Windows {
    const parsed: Windows = {
      activeWindowParsedByArc: null,
      openWindows: [],
    };

    if (!jsonData) return parsed;

    const data = jsonData as Record<string, unknown> & {
      windows: Record<string, unknown>[];
      lastFocusedSpaceID: string;
    };

    if (!data.windows || !Array.isArray(data.windows)) {
      return parsed;
    }

    if (this.spacesMap.length === 0)
      console.error("No spaces found when parsing windows");

    parsed.activeWindowParsedByArc = {
      id: data.lastFocusedSpaceID as string | undefined,
      name: this.getSpaceById(this.spacesMap, data.lastFocusedSpaceID)?.name,
    };

    const windows = data.windows;
    if (windows.length === 0) {
      return parsed;
    }

    const getMaxFromOddIndices = (dates: number[]): number => {
      return dates.reduce((max, current, index) => {
        return index % 2 === 1 && current > max ? current : max;
      }, -1);
    };

    parsed.openWindows = windows
    .map(
      (item: {
        focusedSpaceID: string;
        itemLastActiveDates: number[];
        itemCreatedDates: number[];
      }): Space => ({
        id: item.focusedSpaceID,
        name: this.getSpaceById(this.spacesMap, item.focusedSpaceID)?.name,
        lastChangeDate: Math.max(
          getMaxFromOddIndices(item.itemCreatedDates),
          getMaxFromOddIndices(item.itemLastActiveDates),
        ),
      }),
    )
    .sort((a, b) => b.lastChangeDate - a.lastChangeDate);

    return parsed;
  }

  private parseProfiles(jsonData: StorableSidebar): Profile[] {
    const defaultSpaces: Space[] = [];
    const customGroups = new Map<string, Profile>();

    if (jsonData === undefined) return [];

    const data = jsonData as Record<string, unknown>;
    if (!data.sidebar || typeof data.sidebar !== "object") {
      return [];
    }

    const sidebar = data.sidebar as Record<string, unknown>;
    if (!sidebar.containers || !Array.isArray(sidebar.containers)) {
      return [];
    }

    for (const container of sidebar.containers) {
      if (!container?.spaces || !Array.isArray(container.spaces)) continue;

      for (const spaceItem of container.spaces) {
        if (typeof spaceItem !== "object" || !spaceItem?.id) continue;

        const space: Space = { id: spaceItem.id, name: spaceItem.title };
        const profile = spaceItem.profile;

        if (profile?.default) {
          defaultSpaces.push(space);
        } else if (profile?.custom?._0?.directoryBasename) {
          const basename = profile.custom._0.directoryBasename;

          if (!customGroups.has(basename)) {
            customGroups.set(basename, { title: spaceItem.title, spaces: [] });
          }

          if (
            customGroups.get(basename).title === undefined &&
            spaceItem.title
          ) {
            customGroups.get(basename).title = spaceItem.title;
          }

          customGroups.get(basename)?.spaces.push(space);
        }
      }
    }

    const profileGroups: Profile[] = [];

    if (defaultSpaces.length > 0) {
      profileGroups.push({ title: "default", spaces: defaultSpaces });
    }

    for (const [, spaces] of customGroups) {
      profileGroups.push(spaces);
    }

    return profileGroups;
  }

  private getSpaceById(spaces: Space[], id: string) {
    const space = spaces.find((space) => space.id === id);

    if (space) return space;

    console.error(`Space with id ${id} not found`);
  }

  private inferMissingSpaceNames() {
    this.profiles.forEach((profile) => {
      // Find spaces with undefined names in this profile
      const undefinedSpaces = profile.spaces.filter(
        (space) => !space.name || space.name === "undefined",
      );

      if (undefinedSpaces.length === 0) return; // No undefined spaces in this profile

      // Get all unique space names in this profile (excluding undefined ones)
      const definedSpaceNames = profile.spaces
        .filter((space) => space.name && space.name !== "undefined")
        .map((space) => space.name);

      const uniqueSpaceNames = [...new Set(definedSpaceNames)];

      // If there's exactly one unique space name in the profile, use it for undefined spaces
      if (uniqueSpaceNames.length === 1) {
        const inferredName = uniqueSpaceNames[0];

        undefinedSpaces.forEach((space) => {
                    console.log(`Inferring space name for ${space.id}: ${inferredName}`);
          space.name = inferredName;

          // Also update the corresponding space in this.spaces array
          const globalSpaceIndex = this.spacesMap.findIndex(
            (s) => s.id === space.id,
          );
          if (globalSpaceIndex !== -1) {
            this.spacesMap[globalSpaceIndex].name = inferredName;
            //            console.log(`Updated global spaces array for ${space.id}: ${inferredName}`);
          } else {
            // If space doesn't exist in global spaces array, add it
            this.spacesMap.push({
              id: space.id,
              name: inferredName,
              //              lastChangeDate: space.lastChangeDate,
            });
            //            console.log(`Added new space to global array: ${space.id} -> ${inferredName}`);
          }
        });
      } else {
        // Multiple unique names exist, keep undefined spaces as they are
        //        console.log(`Profile "${profile.title}" has ${uniqueSpaceNames.length} unique space names, keeping ${undefinedSpaces.length} spaces undefined`);
      }
    });
  }

  /**
   * We will use last active window data to parse the space name attached to it when possible.
   * Some temporary windows might not have a space name, so we will use the one parsed by Arc.
   * But before we do that, we will try to infer the space name from the window profile.
   * */
  async getLastActiveSpaceName(): Promise<{name: string, confidence: Confidence}> {
    await this.isReady();

    // We are interested in the very latest opened window.
    //
    // Parsed open window might or might not have a space name
    // > It does not have a space name if it's a new window made by
    // > dragging tab outside, and it has a profile which is shared
    // > by multiple spaces
    let fromActiveWindow: string = undefined
    if (this.windows.openWindows[0] && this.windows.openWindows[0].name) {
      fromActiveWindow = this.windows.openWindows[0].name
    }

    // In case the last active window has no space name, we trust
    // parsing done by Arc itself
    const fromArc = this.windows.activeWindowParsedByArc.name

    if(fromActiveWindow)
      return {
        name: fromActiveWindow,
        confidence: fromActiveWindow === fromArc ? Confidence.HIGH : Confidence.MEDIUM
      }

    return {
      name: this.windows.activeWindowParsedByArc.name,
      confidence: Confidence.LOW
    }
  }
}
