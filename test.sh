#!/bin/bash

TEST_NODE_FOLDER=./test/back

# node install https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions
# curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
# sudo -E bash nodesource_setup.sh
# sudo apt-get install -y nodejs

# chrome install https://doc.ubuntu-fr.org/google_chrome
# sudo sh -c 'echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'
# wget -O- https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo tee /etc/apt/trusted.gpg.d/linux_signing_key.pub
# sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 78BD65473CB3BD13
# sudo apt-get update
# sudo apt-get install google-chrome-stable

if [ ! -d "$TEST_NODE_FOLDER/node_modules" ]; then
  npm i --prefix $TEST_NODE_FOLDER
fi

node "$TEST_NODE_FOLDER/main.js"
