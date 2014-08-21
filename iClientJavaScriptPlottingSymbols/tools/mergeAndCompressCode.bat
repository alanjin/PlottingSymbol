@ECHO OFF
setlocal enabledelayedexpansion

rem 如果PlottingSymbol.js或PlottingSymbol-min.js已存在，删除...
if exist ..\iClientJavaScriptPlottingSymbols.js (
echo "delete iClientJavaScriptPlottingSymbols.js" 
del /q ..\iClientJavaScriptPlottingSymbols.js
) 

if exist ..\iClientJavaScriptPlottingSymbols-min.js (
echo "delete iClientJavaScriptPlottingSymbols-min.js" 
del /q ..\iClientJavaScriptPlottingSymbols-min.js
) 

rem 合并文件
echo merging...
for /f %%i in (filelist.txt) do type %%i >> ..\iClientJavaScriptPlottingSymbols.js

rem 压缩文件
echo compressing...
java -jar yuicompressor-2.4.2.jar ..\iClientJavaScriptPlottingSymbols.js -o ..\iClientJavaScriptPlottingSymbols-min.js --charset utf-8

echo completed.