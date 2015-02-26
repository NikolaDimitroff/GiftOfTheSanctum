call run_tests.bat
call check_code.bat
@echo off
echo Build started...
echo Building js
call node_modules\.bin\browserify.cmd src\game_client\client.js -o distr\client.js
echo Building less
call node_modules\.bin\lessc.cmd src\game_client\style\main.less > distr\main.css
echo Copying views
copy /Y src\game_client\*.html distr> nul
echo Copying fonts
robocopy src\game_client\style\fonts distr\fonts > nul
echo Copying cursors
robocopy src\game_client\style\cursors distr\cursors > nul
echo Build complete!
@echo on
