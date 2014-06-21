#!/bin/bash

DESCRIPTION="Simple Login Web Client"

STANDALONE_DEST="../firebase-clients/js/simple-login"
STANDALONE_STUB="firebase-simple-login"

# Ensure they updated the changelog
read -p "Have you remembered to update the changelog for this release? (Y/n) " HAS_UPDATED_CHANGELOG
if [[ $HAS_UPDATED_CHANGELOG != "" &&  $HAS_UPDATED_CHANGELOG != "Y" && $HAS_UPDATED_CHANGELOG != "y" ]]; then
  exit 1
fi
echo

# Check for destination
if [[ ! -d $STANDALONE_DEST ]]; then
  echo "Eror: Destination directory not found; 'firebase-clients' needs to be a sibling of this repo."
  exit 1
fi

# Get the version we are releasing
PARSED_VERSION=$(grep "CLIENT_VERSION" firebase-simple-login-debug.js | head -1 |awk -F '"' '{print $2}')

# Ensure this is the correct version number
read -p "What version are we releasing? ($PARSED_VERSION) " VERSION
if [[ -z $VER ]]; then
  VERSION=$PARSED_VERSION
fi
echo

# Create a new tag if they have not already done so
read -p "Have you already tagged the latest commit as v${VERSION}? (y/N) " HAS_TAGGED_REPO
if [[ $HAS_TAGGED_REPO == "" ||  $HAS_TAGGED_REPO == "N" || $HAS_TAGGED_REPO == "n" ]]; then
  git tag v$VERSION
  git push --tags

  echo
  echo "*** Last commit tagged as v${VERSION} ***"
fi
echo

# Check if we already have this as a standalone
STANDALONE_TARGET_DIR="${STANDALONE_DEST}/${VERSION}/"
if [[ -e ${STANDALONE_TARGET_DIR} ]]; then
  echo "Error: The target directory already exists: ${STANDALONE_TARGET_DIR}."
  exit 1
fi

# Make the target directory
mkdir $STANDALONE_DEST/$VERSION

# Copy the files to the target directory
cp $STANDALONE_STUB.js $STANDALONE_TARGET_DIR
cp $STANDALONE_STUB-debug.js $STANDALONE_TARGET_DIR

echo "*** Client (debug and non-debug) copied ***"
echo

# Overwrite the existing changelog
cp CHANGELOG.md $STANDALONE_DEST/changelog.txt

echo "*** Changelog copied ***"
echo

# Push the new files to the firebase-clients repo
cd ${STANDALONE_DEST}/
git add .
git commit -am "[firebase-release] Updated Firebase $DESCRIPTION to $VERSION"
git push
if [[ $? -ne 0 ]]; then
  echo "Error pushing firebase-clients."
  exit 1
fi
echo

echo "*** Changes pushed to firebase-client ***"
echo

# Go back to starting directory
cd -

echo
echo "Manual steps:"
echo "  1) Deploy firebase-clients to CDN via Jenkins"
echo "  2) Update the release notes for version ${VERSION} on GitHub"
echo "  3) Tweet @FirebaseRelease: 'v${VERSION} of @Firebase Simple Login web client is available https://cdn.firebase.com/js/simple-login/$VERSION/firebase-simple-login.js Changelog: https://cdn.firebase.com/js/simple-login/changelog.txt'"
echo
echo "Done! Woo!"
echo