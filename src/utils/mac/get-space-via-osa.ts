import { exec } from 'child_process';


const query = `
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

export const getSpaceViaOsa = async () => {
	return new Promise((resolve) => {
		exec(`osascript -e '${query}'`, (error, stdout) => {
			if (error) {
				console.error('Failed to execute AppleScript:', error);
				resolve(null);
				return;
			}

			const output = stdout.trim();

			if (output.startsWith('success:')) {
				const spaceName = output.substring('success:'.length);
				console.log({spaceName})
				resolve(spaceName);
			} else if (output.startsWith('error:')) {
				console.error('AppleScript error:', output.substring('error:'.length));
				resolve(null);
			} else {
				console.error('Unexpected AppleScript output format:', output);
				resolve(null);
			}
		});
	});

};