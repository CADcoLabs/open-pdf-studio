' Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
'
' Batch-exports the 2D profile sketch from every SolidWorks weldment
' library feature part (.SLDLFP) under ROOT_FOLDER to a DXF file under
' OUTPUT_ROOT, mirroring the source folder structure. Skips the folder
' named SKIP_FOLDER_NAME and anything that isn't a .sldlfp file. Never
' modifies or overwrites a source file. Logs any failure to
' OUTPUT_ROOT\_export_log.txt and continues with the next file.
'
' To run: in SolidWorks, Tools > Macro > New..., delete the stub Sub
' main() SolidWorks generates, paste this file's contents in its place,
' adjust ROOT_FOLDER / OUTPUT_ROOT below if needed, then press F5.

Option Explicit

Dim swApp As SldWorks.SldWorks

Const ROOT_FOLDER As String = "P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles\ansi inch"
Const OUTPUT_ROOT As String = "C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export"
Const SKIP_FOLDER_NAME As String = "acm clips old"

Sub main()

    Set swApp = Application.SldWorks

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(OUTPUT_ROOT) Then
        fso.CreateFolder OUTPUT_ROOT
    End If

    Dim logPath As String
    logPath = OUTPUT_ROOT & "\_export_log.txt"
    Dim logNum As Integer
    logNum = FreeFile
    Open logPath For Output As #logNum
    Print #logNum, "MAPI weldment profile export log -- " & Now

    Dim files As New Collection
    CollectSldlfpFiles fso, fso.GetFolder(ROOT_FOLDER), files

    Dim total As Long, ok As Long, failed As Long
    total = files.Count

    Dim f As Variant
    For Each f In files
        Dim result As String
        result = ExportOneProfile(fso, CStr(f))
        If result = "" Then
            ok = ok + 1
        Else
            failed = failed + 1
            Print #logNum, CStr(f) & " -- " & result
        End If
    Next f

    Print #logNum, "Done. " & ok & " exported, " & failed & " failed, " & total & " total."
    Close #logNum

    MsgBox ok & " of " & total & " profiles exported to DXF." & vbCrLf & _
           failed & " failed -- see " & logPath, vbInformation, "MAPI Profile Export"

End Sub

' Recursively collects every *.sldlfp file under `folder` into `results`,
' skipping any subfolder named SKIP_FOLDER_NAME (case-insensitive).
Sub CollectSldlfpFiles(fso As Object, folder As Object, results As Collection)

    Dim file As Object
    For Each file In folder.Files
        If LCase(fso.GetExtensionName(file.Path)) = "sldlfp" Then
            results.Add file.Path
        End If
    Next file

    Dim subFolder As Object
    For Each subFolder In folder.SubFolders
        If LCase(subFolder.Name) <> LCase(SKIP_FOLDER_NAME) Then
            CollectSldlfpFiles fso, subFolder, results
        End If
    Next subFolder

End Sub

' Opens one .sldlfp, finds its ProfileFeature sketch, copies it into a new
' drawing, saves that drawing as a DXF mirroring the source's folder
' structure under OUTPUT_ROOT, then closes both documents. Never saves
' over the source .sldlfp. Returns "" on success, or an error description.
Function ExportOneProfile(fso As Object, sourcePath As String) As String

    On Error GoTo ErrHandler

    Dim errs As Long, warns As Long
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.OpenDoc6(sourcePath, swDocumentTypes_e.swDocPART, _
        swOpenDocOptions_e.swOpenDocOptions_Silent, "", errs, warns)

    If swModel Is Nothing Then
        ExportOneProfile = "OpenDoc6 failed (errs=" & errs & ", warns=" & warns & ")"
        Exit Function
    End If

    Dim swFeat As SldWorks.Feature
    Set swFeat = swModel.FirstFeature
    Dim swProfileFeat As SldWorks.Feature
    Set swProfileFeat = Nothing
    Do While Not swFeat Is Nothing
        If swFeat.GetTypeName2() = "ProfileFeature" Then
            Set swProfileFeat = swFeat
            Exit Do
        End If
        Set swFeat = swFeat.GetNextFeature
    Loop

    If swProfileFeat Is Nothing Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "No ProfileFeature sketch found"
        Exit Function
    End If

    swProfileFeat.Select2 False, -1
    swModel.EditCopy

    Dim drawTemplate As String
    drawTemplate = swApp.GetUserPreferenceStringValue(swUserPreferenceStringValue_e.swDefaultTemplateDrawing)
    If drawTemplate = "" Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "No default drawing template configured in SolidWorks options"
        Exit Function
    End If

    Dim swDraw As SldWorks.ModelDoc2
    Set swDraw = swApp.NewDocument(drawTemplate, swDwgPaperSizes_e.swDwgPapersUserDefined, 0.5, 0.5)
    If swDraw Is Nothing Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "Failed to create temporary drawing"
        Exit Function
    End If
    swDraw.Paste

    Dim outPath As String
    outPath = MirroredOutputPath(sourcePath)
    EnsureFolderExists fso, fso.GetParentFolderName(outPath)

    Dim saveErrs As Long, saveWarns As Long
    Dim saveOk As Boolean
    saveOk = swDraw.Extension.SaveAs(outPath, swSaveAsVersion_e.swSaveAsCurrentVersion, _
        swSaveAsOptions_e.swSaveAsOptions_Silent, Nothing, saveErrs, saveWarns)

    swApp.CloseDoc swDraw.GetTitle
    swApp.CloseDoc swModel.GetTitle

    If Not saveOk Then
        ExportOneProfile = "SaveAs DXF failed (errs=" & saveErrs & ", warns=" & saveWarns & ")"
        Exit Function
    End If

    ExportOneProfile = ""
    Exit Function

ErrHandler:
    ExportOneProfile = "Unexpected error: " & Err.Description
End Function

' Maps e.g. "...\ansi inch\angle alum\1 X 1 X .125 ARCH. ANGLE.SLDLFP"
' to "OUTPUT_ROOT\angle alum\1 X 1 X .125 ARCH. ANGLE.dxf" -- everything
' below ROOT_FOLDER is preserved, the .sldlfp extension becomes .dxf.
Function MirroredOutputPath(sourcePath As String) As String
    Dim relative As String
    relative = Mid(sourcePath, Len(ROOT_FOLDER) + 2) ' +2 skips ROOT_FOLDER and its trailing "\"
    Dim withoutExt As String
    withoutExt = Left(relative, Len(relative) - Len(".sldlfp"))
    MirroredOutputPath = OUTPUT_ROOT & "\" & withoutExt & ".dxf"
End Function

Sub EnsureFolderExists(fso As Object, folderPath As String)
    If fso.FolderExists(folderPath) Then Exit Sub
    Dim parent As String
    parent = fso.GetParentFolderName(folderPath)
    If parent <> "" And Not fso.FolderExists(parent) Then
        EnsureFolderExists fso, parent
    End If
    fso.CreateFolder folderPath
End Sub
