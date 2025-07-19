import os from "os";
import { readJsonFile } from "../utils/read-json-file";

interface Space {
  id: string;
  name: string;
  lastChangeDate?: number;
}

interface LastFocused {
  global: string | undefined; // Confidence is mid. Use only if space is undefined in windows
  windows: { spaceId: string; lastActivatedItem: number }[]; // Confidence is high
}

interface Profile {
  title: string;
  spaces: Space[];
}

export class ArcMacService {
  private readonly initializationPromise: Promise<void>;

  public sidebar;
  public windows;
  public spaces: Space[] = [];
  public profiles: Profile[];
  public lastFocused: LastFocused;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    const { sidebar, windows, spaces, lastFocused, profileGroup } = await this.getData();

    this.sidebar = sidebar;
    this.windows = windows;
    this.spaces = spaces;
    this.lastFocused = lastFocused;
    this.profiles = profileGroup;

    this.inferMissingSpaceNames();
  }

  async isReady() {
    await this.initializationPromise;
    return true;
  }

  async getData() {
    const sidebarPromise = this.getStorableSidebar();
    const windowsPromise = this.getStorableWindows();

    const [$sidebar, $windows] = await Promise.all([
      sidebarPromise,
      windowsPromise,
    ]);

    return {
      sidebar: $sidebar,
      windows: $windows,
      spaces: this.parseSpaces($sidebar),
      lastFocused: this.parseWindows($windows),
      profileGroup: this.parseProfileSpaces($sidebar),
    };
  }

  private getStorableSidebar = async () => {
    const { username } = os.userInfo();

    return readJsonFile(
      `/Users/${username}/Library/Application Support/Arc/StorableSidebar.json`,
    );
  };

  private getStorableWindows = async (): Promise<any> => {
    const { username } = os.userInfo();

    return readJsonFile(
      `/Users/${username}/Library/Application Support/Arc/StorableWindows.json`,
    );
  };

  private parseSpaces(jsonData: unknown): Space[] {
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

  private parseWindows(jsonData: unknown): LastFocused {
    const lastFocused: LastFocused = {
      global: null,
      windows: [],
    };

    if (!jsonData) return lastFocused;

    const data = jsonData as Record<string, unknown>;
    if (!data.windows || !Array.isArray(data.windows)) {
      return lastFocused;
    }

    lastFocused.global = data.lastFocusedSpaceID as string | undefined;

    const windows = data.windows;
    if (windows.length === 0) {
      return lastFocused;
    }

    const getMaxFromOddIndices = (dates: number[]): number => {
      return dates.reduce((max, current, index) => {
        return index % 2 === 1 && current > max ? current : max;
      }, -1);
    };

    lastFocused.windows = windows.map(
      (item: {
        focusedSpaceID: string;
        itemLastActiveDates: number[];
        itemCreatedDates: number[];
      }) => ({
        spaceId: item.focusedSpaceID,
        lastActivatedItem: Math.max(
          getMaxFromOddIndices(item.itemCreatedDates),
          getMaxFromOddIndices(item.itemLastActiveDates),
        ),
      }),
    );
    return lastFocused;
  }

  private parseProfileSpaces(jsonData: unknown): Profile[] {
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

//    console.error(`Space with id ${id} not found`);
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
          //          console.log(`Inferring space name for ${space.id}: ${inferredName}`);
          space.name = inferredName;

          // Also update the corresponding space in this.spaces array
          const globalSpaceIndex = this.spaces.findIndex(
            (s) => s.id === space.id,
          );
          if (globalSpaceIndex !== -1) {
            this.spaces[globalSpaceIndex].name = inferredName;
            //            console.log(`Updated global spaces array for ${space.id}: ${inferredName}`);
          } else {
            // If space doesn't exist in global spaces array, add it
            this.spaces.push({
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

  async getLastActiveSpaceName() {
    await this.isReady();

    const mostRecentWindow = this.lastFocused.windows
      .map(({ spaceId, ...rest }) => {
        return {
          space: this.getSpaceById(this.spaces, spaceId),
          ...rest,
        };
      })
      .sort((a, b) => b.lastActivatedItem - a.lastActivatedItem);

    // We are interested in very latest window. It might or might not have a space name
    // If has, simply return it.
    if (mostRecentWindow[0] && mostRecentWindow[0].space) {
      return mostRecentWindow[0].space.name;
    }

    // Otherwise fallback to global focused space. Which means that space name will be inferred
    // From the root window. Whichever space is active there.
    const globalSpace = this.spaces.find(
      ({ id }) => id === this.lastFocused.global,
    );
    return globalSpace?.name;
  }
}
