import fs from "fs";
import * as os from "os";

// TODO: strict type it all

type Required<T> = T & {
    [key: string]: any;
}

const parseContents = async (path: string): Promise<object> => {
    const contents = await fs.readFileSync(path, 'utf-8');

    try {
        return JSON.parse(contents);
    } catch (e) {
        console.log(e)
        return undefined
    }
}

export const getStorableSidebar = async () => {
    const {username} = os.userInfo();

    return parseContents(`/Users/${username}/Library/Application Support/Arc/StorableSidebar.json`);
}

export const getStorableWindows = async (): Promise<any> => {
    const {username} = os.userInfo();

    return parseContents(`/Users/${username}/Library/Application Support/Arc/StorableWindows.json`);
}

export const parseSpacesData = (sidabarJson: any): any => {
    if(!sidabarJson) return []


    return sidabarJson.sidebar.containers
        .filter((e: any) => e.spaces)
        .map((e: any) => e.spaces)
        .reduce((acc: any, val: any) => acc.concat(val), [])
        .reduce((acc, val, i) => {
            if (i % 2 === 0) {
                acc.push({id: val});
            } else {
                acc[acc.length - 1].title = val.title;
            }

            return acc;
        }, []);
}

export const itemsData = (sidabarJson: any) => {
    return sidabarJson?.sidebar?.containers
        .filter(e => e.items)
        .map(e => e.items)
        .reduce((acc, val) => acc.concat(val), [])
        .reduce((acc, val, i) => {
            if (i % 2 !== 0) {
                acc[acc.length] = val;
            }
            return acc;
        }, []);
}

export const findElement = (obj: Required<{ id: string }>[], id: string) => {
    let r = null;

    obj.some(e => {
        if (e.id === id) {
            r = e;
        }
    });

    return r;
};

export const populateParentTree = (obj: any, haystack: any): any => {
    if (obj.parentID) {
        const parentObj = findElement(haystack, obj.parentID);
        if (parentObj) {
            obj.parentData = populateParentTree(parentObj, haystack);
        }
    }
    return obj;
};

export const deepestParent = (obj: any): any => {
    if (obj.parentData) {
        return deepestParent(obj.parentData);
    }
    return obj;
};

export const latestActiveTabs = (items: any, spaces: any) => {
    return items
        .filter(e => typeof e !== 'string')
        .filter(e => e.data?.tab)
        .map(e => ({
            tab: e.data.tab,
            timeLastActiveAt: e.data.tab.timeLastActiveAt,
            id: e.id,
            parentID: e.parentID
        }))
        .sort((a: any, b: any) => b.timeLastActiveAt - a.timeLastActiveAt)
        .map(e => populateParentTree(e, items))
        .map(e => {
            const spaceID = deepestParent(e).data.itemContainer.containerType.spaceItems?._0;
            const spaceName = spaces.filter(e => e.id === spaceID).map(e => e.title)[0];

            return {
                tab: e.tab,
                spaceID,
                spaceName
            }
        })
}

export const latestActiveWindow = (windows: any[]) => {
    let min = -1, index = -1
    windows.forEach(({itemLastActiveDates}, i)=> {
        if(min === -1) {
            min = itemLastActiveDates
            index = i
        }

        if(itemLastActiveDates < min) {
            min = itemLastActiveDates
            index = i
        }
    })

    return windows[index]
}

export const getSpaceNameById = (spaces: any[], id: string) => spaces.filter(e => e.id ===id).map(e => e.title)[0];
