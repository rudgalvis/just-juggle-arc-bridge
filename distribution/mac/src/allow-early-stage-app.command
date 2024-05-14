#!/bin/bash

# Replace 'YourApplication' with the name of your application
APP_NAME="Just Juggle - Arc Bridge"

# Path to the application in the Applications folder
APP_PATH="/Applications/$APP_NAME.app"

# Check if the application exists
if [ -d "$APP_PATH" ]; then
    # Remove the com.apple.quarantine attribute
    sudo xattr -r -d com.apple.quarantine "$APP_PATH"
    echo "$APP_NAME is now ready to use!"
else
    echo "Error: $APP_NAME not found in the Applications folder."
fi