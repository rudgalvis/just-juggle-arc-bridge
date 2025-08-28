import { spawn, ChildProcess } from 'child_process';

export class ArcSpaceMonitor {
  private process: ChildProcess | null = null;
  private isMonitoring = false;
  private callback: ((spaceName: string) => void) | null = null;

  startMonitoring(callback: (spaceName: string) => void, debug = false) {
    if (this.isMonitoring) {
      console.log('Already monitoring');
      return;
    }

    this.callback = callback;
    this.isMonitoring = true;

    // Event-driven script that only activates when Arc becomes frontmost
    const script = `
on run
  set lastKnownSpace to ""
  ${debug ? 'log "Starting event-driven Arc space monitoring..."' : ''}
  
  repeat
    try
      tell application "System Events"
        -- Wait for Arc to become frontmost (low CPU usage)
        repeat while true
          set frontmostProcesses to application processes whose frontmost is true
          if (count of frontmostProcesses) > 0 then
            set frontmostProcess to item 1 of frontmostProcesses
            set frontmostAppName to name of frontmostProcess
            
            if frontmostAppName is "Arc" then
              ${debug ? 'log "Arc became frontmost"' : ''}
              exit repeat
            end if
          end if
          delay 0.5  -- Only check twice per second when Arc is not active
        end repeat
        
        -- Arc is now frontmost, get the current space
        tell application process "Arc"
          try
            delay 0.2  -- Let Arc fully activate
            set spacesMenu to menu "Spaces" of menu bar item "Spaces" of menu bar 1
            set menuItems to menu items of spacesMenu
            
            repeat with menuItem in menuItems
              try
                set itemTitle to title of menuItem
                set menuMark to value of attribute "AXMenuItemMarkChar" of menuItem
                if menuMark is not missing value and menuMark is not "" then
                  if itemTitle is not lastKnownSpace then
                    set lastKnownSpace to itemTitle
                    log "SPACE_CHANGE:" & itemTitle
                    ${debug ? 'log "Arc space: " & itemTitle' : ''}
                  end if
                  exit repeat
                end if
              on error itemError
                ${debug ? 'log "Menu item error: " & itemError' : ''}
              end try
            end repeat
          on error menuError
            ${debug ? 'log "Menu access error: " & menuError' : ''}
          end try
        end tell
        
        -- Now monitor for space changes while Arc remains frontmost
        repeat while true
          set currentFrontmostProcesses to application processes whose frontmost is true
          if (count of currentFrontmostProcesses) > 0 then
            set currentFrontmostProcess to item 1 of currentFrontmostProcesses
            set currentFrontmostAppName to name of currentFrontmostProcess
            
            -- If Arc lost focus, break out to wait for it to become frontmost again
            if currentFrontmostAppName is not "Arc" then
              ${debug ? 'log "Arc lost focus"' : ''}
              exit repeat
            end if
            
            -- Arc is still frontmost, check for space changes
            tell application process "Arc"
              try
                set spacesMenu to menu "Spaces" of menu bar item "Spaces" of menu bar 1
                set menuItems to menu items of spacesMenu
                
                repeat with menuItem in menuItems
                  try
                    set itemTitle to title of menuItem
                    set menuMark to value of attribute "AXMenuItemMarkChar" of menuItem
                    if menuMark is not missing value and menuMark is not "" then
                      if itemTitle is not lastKnownSpace then
                        set lastKnownSpace to itemTitle
                        log "SPACE_CHANGE:" & itemTitle
                        ${debug ? 'log "Space changed to: " & itemTitle' : ''}
                      end if
                      exit repeat
                    end if
                  on error itemError
                    ${debug ? 'log "Menu item error during monitoring: " & itemError' : ''}
                  end try
                end repeat
              on error menuError
                ${debug ? 'log "Menu access error during monitoring: " & menuError' : ''}
              end try
            end tell
          end if
          
          delay 1  -- Check for space changes every second while Arc is active
        end repeat
        
      end tell
    on error generalError
      log "ERROR:" & generalError
      delay 2  -- Wait before retrying on error
    end try
  end repeat
end run`;

    this.process = spawn('osascript', ['-e', script]);

    this.process.stdout?.on('data', (data) => {
      const output = data.toString();
      if (debug) console.log('Raw output:', output);

      const lines = output.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('SPACE_CHANGE:')) {
          const spaceName = trimmedLine.split('SPACE_CHANGE:')[1]?.trim();
          if (spaceName && this.callback) {
            this.callback(spaceName);
          }
        } else if (trimmedLine.includes('ERROR:')) {
          console.error('AppleScript error:', trimmedLine);
        }
      }
    });

    this.process.stderr?.on('data', (data) => {
      console.error('AppleScript stderr:', data.toString());
    });

    this.process.on('exit', (code, signal) => {
      console.log(`AppleScript process exited with code ${code}, signal ${signal}`);
      this.cleanup();
    });

    this.process.on('error', (error) => {
      console.error('Process error:', error);
      this.cleanup();
    });

    console.log('Started event-driven Arc space monitoring with PID:', this.process.pid);
  }

  private cleanup() {
    this.isMonitoring = false;
    this.process = null;
    this.callback = null;
  }

  stopMonitoring() {
    if (this.process) {
      console.log('Stopping monitoring process...');
      this.process.kill('SIGTERM');

      // Force kill if it doesn't stop gracefully
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          console.log('Force killing process...');
          this.process.kill('SIGKILL');
        }
      }, 2000);
    }
    this.cleanup();
    console.log('Stopped monitoring Arc spaces');
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring && this.process !== null;
  }

  // Get current space without continuous monitoring
  async getCurrentSpace(): Promise<string | null> {
    const script = `
tell application "System Events"
  set frontmostProcesses to application processes whose frontmost is true
  if (count of frontmostProcesses) > 0 then
    set frontmostProcess to item 1 of frontmostProcesses
    if name of frontmostProcess is "Arc" then
      tell frontmostProcess
        try
          set spacesMenu to menu "Spaces" of menu bar item "Spaces" of menu bar 1
          set menuItems to menu items of spacesMenu
          
          repeat with menuItem in menuItems
            try
              set itemTitle to title of menuItem
              set menuMark to value of attribute "AXMenuItemMarkChar" of menuItem
              if menuMark is not missing value and menuMark is not "" then
                return itemTitle
              end if
            end try
          end repeat
        end try
      end tell
    end if
  end if
  return ""
end tell`;

    return new Promise((resolve) => {
      const tempProcess = spawn('osascript', ['-e', script]);
      let output = '';

      tempProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      tempProcess.on('exit', () => {
        const result = output.trim();
        resolve(result || null);
      });

      tempProcess.on('error', () => {
        resolve(null);
      });
    });
  }
}

export default ArcSpaceMonitor;