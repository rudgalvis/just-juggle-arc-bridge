import fs from "fs";
import * as os from "os";

type Required<T> = T & {
    [key: string]: any;
}

export const getSidebarJson = async () => {
    const {username} = os.userInfo();

    const filePath = `/Users/${username}/Library/Application Support/Arc/StorableSidebar.json`;

    const contents = await fs.readFileSync(filePath, 'utf-8');

    return JSON.parse(contents);
}

export const spacesData = (sidabarJson: any) => {
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
    return sidabarJson.sidebar.containers
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

export const tabsData = (items: any, spaces: any) => {
    return items
        .map(e => populateParentTree(e, items))
        .map(e => {
            const spaceID = deepestParent(e).data.itemContainer.containerType.spaceItems?._0;

            const spaceName = spaces.filter(e => e.id === spaceID).map(e => e.title)[0];

            return {
                tabId: e.data?.tab?.tabId,
                spaceName
            };
        })
        .filter(e => e.tabId)
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
                ...e,
                spaceID,
                spaceName
            }
        })
}

export function flattenObject(obj, parent = '', res = {}) {
    for (let key in obj) {
        let newKey = parent ? `${parent}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            flattenObject(obj[key], newKey, res);
        } else {
            res[newKey] = obj[key];
        }
    }
    return res;
}

export const sortByLastUsed = (obj: any) => {
    // TODO:
}