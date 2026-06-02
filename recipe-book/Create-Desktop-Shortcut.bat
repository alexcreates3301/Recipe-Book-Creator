@echo off
REM ============================================================
REM  Creates a "Recipe Book Creator" shortcut on your Desktop
REM  that launches the app via launch-recipe-book.bat.
REM  Run this once (double-click it).
REM ============================================================

set "TARGET=%~dp0launch-recipe-book.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Recipe Book Creator.lnk"

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut('%SHORTCUT%');" ^
  "$s.TargetPath = '%TARGET%';" ^
  "$s.WorkingDirectory = '%~dp0';" ^
  "$s.IconLocation = '%SystemRoot%\System32\shell32.dll,220';" ^
  "$s.Description = 'Launch the Recipe Book Creator app';" ^
  "$s.Save()"

if errorlevel 1 (
    echo [ERROR] Could not create the shortcut.
    pause
    exit /b 1
)

echo.
echo Desktop shortcut created: "%SHORTCUT%"
echo You can now double-click "Recipe Book Creator" on your Desktop.
echo.
pause
