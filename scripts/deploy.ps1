$out = "\\nesitn7\webcontent\sitnlayers"
xcopy .\index.html $out /D /Y
xcopy .\js $out /D /Y /I
xcopy .\css $out /D /Y /I
xcopy .\assets $out /D /Y /I
