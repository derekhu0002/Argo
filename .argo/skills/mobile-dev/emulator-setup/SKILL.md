---
name: emulator-setup
description: 启动 Android 和鸿蒙模拟器，确�?adb/hdc 可连�?
disable-model-invocation: true
---

# Emulator Setup Skill

Use this skill when the task needs to start Android emulators, HarmonyOS emulators, or verify device connectivity through adb/hdc before running build, install, or screenshot comparison workflows.

## Runtime Boundary

- This is a reference guide skill; no JavaScript runtime entrypoint is required.
- Tool paths are resolved using the same `resolveCommand` pattern as `wp-harmony-build-package-run-skill` and `wp-ui-snapshot-comparison-skill`.

## Known Tool Locations

| Tool | Path |
|------|------|
| `adb.exe` | `C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe` |
| `emulator.exe` | `C:/Users/admin/AppData/Local/Android/Sdk/emulator/emulator.exe` |
| `hdc.exe` | `C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe` |
| `hvigorw.bat` | `C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.js` |

## Available Android AVDs

| AVD Name | Target |
|----------|--------|
| `Medium_Phone` | android-37.0 (google_apis_playstore_ps16k, x86_64) |

List all: `C:/Users/admin/AppData/Local/Android/Sdk/emulator/emulator.exe -list-avds`

> **Note**: `Medium_Phone_2` and `Medium_Phone_3` directories exist on disk but contain stale/corrupted state. Only `Medium_Phone` is a valid, bootable AVD. Recreate the others via Android Studio AVD Manager if needed.

## Commands

### Android Emulator

**Start (cold boot �?always use this to avoid corrupted snapshots):**
```powershell
& 'C:/Users/admin/AppData/Local/Android/Sdk/emulator/emulator.exe' -avd Medium_Phone -no-snapshot-load -no-boot-anim
```
> **Always use `-no-snapshot-load`**. Quickboot snapshots can corrupt after unclean shutdown, leaving the emulator stuck in "offline" state.

**Wait for adb + detect serial:**
```powershell
& 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' wait-for-device
$devices = & 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' devices
$emuSerial = ($devices | Select-String 'emulator-\d+').Matches.Value | Select-Object -First 1
Write-Host "Connected: $emuSerial"
```

**Wait for boot complete:**
```powershell
do {
    Start-Sleep -Seconds 10
    $booted = & 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' shell getprop sys.boot_completed 2>$null
    Write-Host "Boot status: $booted"
} until ($booted -match '^1')
Write-Host "Emulator ready!"
```

**Verify:**
```powershell
& 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' devices
```

**Close (using detected port):**
```powershell
& 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' -s $emuSerial emu kill
```

### HarmonyOS Device

**Verify:**
```powershell
& 'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe' list targets
```

**Install HAP:**
```powershell
& 'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe' app install <hap-path>
```

**Launch app:**
```powershell
& 'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe' shell aa start -a <AbilityName> -b <BundleName>
```

### Troubleshooting: Emulator Stuck "offline"

If `adb devices` shows `emulator-5556   offline`, the emulator process is alive but ADB can't communicate with the guest Android system.

**Root cause**: Stale `multiinstance.lock` + corrupted quickboot snapshot from a previous unclean shutdown. The emulator loads the saved VM snapshot but the Android guest never initializes ADB.

**Diagnose:**
```powershell
# Check for stale lock files
Get-ChildItem 'C:/Users/admin/.android/avd/Medium_Phone.avd/' -Filter 'multiinstance.lock'
Get-Content 'C:/Users/admin/.android/avd/Medium_Phone.avd/quickbootChoice.ini'
```

**Fix (run in order):**
```powershell
# 1. Kill all emulator/QEMU processes
Get-Process emulator,qemu-system-x86_64 -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Remove stale lock files
Remove-Item 'C:/Users/admin/.android/avd/Medium_Phone.avd/multiinstance.lock' -Force -ErrorAction SilentlyContinue

# 3. Restart ADB server
& 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' kill-server
& 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe' start-server

# 4. Cold boot (skip corrupted snapshot)
& 'C:/Users/admin/AppData/Local/Android/Sdk/emulator/emulator.exe' -avd Medium_Phone -no-snapshot-load -no-boot-anim
```

### Environment Variables

```powershell
$env:ANDROID_SDK_ROOT = 'C:/Users/admin/AppData/Local/Android/Sdk'
$env:DEVECO_SDK_HOME = 'C:/Program Files/Huawei/DevEco Studio/sdk/'
$env:HDC_HOME = 'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains'
```

## Instructions

1. Check connectivity: `adb devices` + `hdc list targets`
2. If no device, start Android emulator (HarmonyOS via DevEco Studio Device Manager)
3. **Never hardcode emulator port** �?extract serial from `adb devices` output
4. Wait for `sys.boot_completed=1` before UI tests
