@echo off
set path=%cd%\dist
for /r %path% %%i in (*.min.js) do set %%~nxi=a
for /r %path% %%i in (*.js) do (
    if not defined %%~nxi %cd%\tools\jsmin.exe <%%i> %path%\%%~ni.min.js
)
echo complete
pause