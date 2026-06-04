@echo off
setlocal
cls
echo [1/4] eas init --------------------------------
call npx eas init
if errorlevel 1 pause & exit /b 1

echo.
echo [2/4] eas build:configure ------------------------
call npx eas build:configure
if errorlevel 1 pause & exit /b 1

echo.
echo [3/4] Android production -------------------------
call npx eas build --platform android --profile production
if errorlevel 1 pause & exit /b 1

echo.
echo [4/4] iOS production -----------------------------
call npx eas build --platform ios --profile production
if errorlevel 1 pause & exit /b 1

echo.
echo All done.
pause
