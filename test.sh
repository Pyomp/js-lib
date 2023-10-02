TEST_NODE_FOLDER=./modules/test/back

if [ ! -d "$TEST_NODE_FOLDER/node_modules" ]; then
  npm i --prefix $TEST_NODE_FOLDER
fi

node "$TEST_NODE_FOLDER/main.js"
