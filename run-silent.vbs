Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\habblaud"
WshShell.Run "cmd /c set HABBLAUD_LANG=vi && npm start", 0, False
WScript.Sleep 1500
WshShell.Run "cmd /c start http://localhost:4747", 0, False
