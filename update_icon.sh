#!/usr/bin/env bash

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# Configuration
SOURCE_ICON="assets/icon.png"
RES_PATH="android/app/src/main/res"

echo -e "${CYAN}🎨 Starting Manual Icon Update...${RESET}"

# 1. Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
  echo -e "${RED}❌ Error: '$SOURCE_ICON' not found.${RESET}"
  echo -e "${YELLOW}Please create a folder named 'assets' and put your 'icon.png' inside it.${RESET}"
  exit 1
fi

# 2. Check if Android project exists
if [ ! -d "$RES_PATH" ]; then
  echo -e "${RED}❌ Error: Android project not found at '$RES_PATH'.${RESET}"
  echo -e "${YELLOW}Run 'npx cap add android' first.${RESET}"
  exit 1
fi

# 3. Replace Standard and Round Icons (Mipmap folders)
# We loop through all densities and brute-force copy the high-res icon
FOLDERS=("mipmap-mdpi" "mipmap-hdpi" "mipmap-xhdpi" "mipmap-xxhdpi" "mipmap-xxxhdpi")

echo -e "${YELLOW}🔄 Overwriting launcher icons...${RESET}"

for folder in "${FOLDERS[@]}"; do
  TARGET_DIR="$RES_PATH/$folder"
  
  if [ -d "$TARGET_DIR" ]; then
    # Replace standard square icon
    cp "$SOURCE_ICON" "$TARGET_DIR/ic_launcher.png"
    # Replace round icon
    cp "$SOURCE_ICON" "$TARGET_DIR/ic_launcher_round.png"
    echo -e "   └─ Updated $folder"
  fi
done

# 4. Replace Adaptive Icon Foreground
# We must DELETE existing .xml files first to avoid "Duplicate resources" error
echo -e "${YELLOW}🔄 Updating adaptive icon foregrounds...${RESET}"

# Update standard drawable folder
if [ -d "$RES_PATH/drawable" ]; then
   # REMOVE the conflicting XML file
   rm -f "$RES_PATH/drawable/ic_launcher_foreground.xml"
   
   # Copy the new PNG
   cp "$SOURCE_ICON" "$RES_PATH/drawable/ic_launcher_foreground.png"
   echo -e "   └─ Updated drawable/ic_launcher_foreground.png (XML removed)"
fi

# Update drawable-v24 folder (Android 7+)
if [ -d "$RES_PATH/drawable-v24" ]; then
   # REMOVE the conflicting XML file
   rm -f "$RES_PATH/drawable-v24/ic_launcher_foreground.xml"
   
   # Copy the new PNG
   cp "$SOURCE_ICON" "$RES_PATH/drawable-v24/ic_launcher_foreground.png"
   echo -e "   └─ Updated drawable-v24/ic_launcher_foreground.png (XML removed)"
fi


