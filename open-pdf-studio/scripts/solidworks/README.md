# MAPI weldment profile DXF export

`ExportWeldmentProfiles.bas` is a SolidWorks VBA macro. It is not run by
any build tool in this repo -- someone with SolidWorks open runs it by
hand, once, to produce the input for `scripts/mapi-profiles/generate.mjs`.

## Running it

1. Open SolidWorks.
2. Tools > Macro > New..., save it anywhere (the file it creates is
   scratch -- the source of truth is `ExportWeldmentProfiles.bas` in this
   folder).
3. Delete the stub `Sub main()` SolidWorks generates and paste in the
   contents of `ExportWeldmentProfiles.bas`.
4. Confirm the `ROOT_FOLDER` and `OUTPUT_ROOT` constants near the top
   match your machine (defaults assume `P:\X-CAD TRANSFER\SOLIDWORKS\...`
   and `C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export`).
5. Press F5. It opens and closes each of the ~474 profile files in turn --
   this takes a few minutes. A message box reports how many succeeded.
6. Check `OUTPUT_ROOT\_export_log.txt` for any failures before handing the
   output folder off for conversion (Task 4/5 of the symbol library plan).

The macro never writes to any file under `ROOT_FOLDER` -- it only reads
`.sldlfp` files and writes new `.dxf` files under `OUTPUT_ROOT`.
