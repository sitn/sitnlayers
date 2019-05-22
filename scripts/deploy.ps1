$out = "\\nesitn7\webcontent\sitnlayers"
xcopy .\index.html $out /D /Y
xcopy .\js $out\js /D /Y /I /E
xcopy .\css $out\css /D /Y /I /E
xcopy .\assets $out\assets /D /Y /I /E
xcopy .\img $out\img /D /Y /I /E