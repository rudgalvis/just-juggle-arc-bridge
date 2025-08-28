import { test } from 'vitest'
import { ArcSpaceMonitor } from './ArcSpaceMonitor'
import { execSync, spawn } from 'child_process'
import { NativeArcMonitor } from './NativeArcSpaceMonitor'
import ActiveWindow, { WindowInfo } from './index';


const workingOssa = `
tell application "System Events"
  tell process "Arc"
    if not frontmost then return "error:Arc not frontmost"
    
    try
      -- Access the Spaces menu structure directly
      set spacesMenu to menu "Spaces" of menu bar item "Spaces" of menu bar 1
      set menuItems to menu items of spacesMenu
      
      set activeSpace to ""
      
      repeat with menuItem in menuItems
        try
          set itemTitle to title of menuItem
          
          -- Check for check mark or other selection indicators
          try
            set menuMark to value of attribute "AXMenuItemMarkChar" of menuItem
            if menuMark is not missing value and menuMark is not "" then
              set activeSpace to itemTitle
              exit repeat
            end if
          end try
          
          -- Alternative: check if item is marked as selected
          try
            if (value of attribute "AXSelected" of menuItem) is true then
              set activeSpace to itemTitle
              exit repeat
            end if
          end try
          
        end try
      end repeat
      
      if activeSpace is not "" then
        return "success:" & activeSpace
      else
        return "error:No active space found"
      end if
      
    on error errorMsg
      return "error:" & errorMsg
    end try
  end tell
end tell`;



test('Try getting last active space name from Arc .jsons on Mac.', async () => {
  ActiveWindow.initialize({ osxRunLoop: 'all' });
  ActiveWindow.requestPermissions();

  console.log(ActiveWindow)

  const watchId = ActiveWindow.subscribe(curWinInfo => {
    console.log('Got new window info');
    if (curWinInfo == null) {
      console.log('Got null window');
      return;
    }

  });

  console.log(watchId)

//  console.log(build)
//
//  const activeWin = ActiveWindow.subscribe((data) => {
//    console.log(data)
//  });
//
//  console.log(activeWin);
  setTimeout(() => ActiveWindow.unsubscribe(watchId), 14000);


  await new Promise((resolve) => setTimeout(resolve, 15000))
}, {timeout: 15000})
