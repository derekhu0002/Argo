---
name: android-apk-build-recovery
description: Builds Android APKs in this carcontrolpanel repository when private Huawei/CDC SDK dependencies are supplied as local files. Use when Gradle APK builds fail on unresolved AAR/JAR dependencies, nonstandard local SDK layouts, manifest/resource merge conflicts, unsigned release APKs, or dex merge memory errors.
disable-model-invocation: true
extraction-note: >-
  Extracted on 2026-07-23 16:15-16:19 UTC+8 from the carcontrolpanel APK build session. Context: Android SDK was
  configured at C:/Users/Administrator/AppData/Local/Android/Sdk, private CDC/Huawei dependencies were supplied under
  D:/tools/CDC-PRACTICE/SDK, and the build required local flatDir dependency wiring, AAR notation fixes, manifest/resource
  recovery, release unsigned APK verification, and debug APK heap tuning. General skill evaluation: keep this as a
  project/specific skill for now because several steps depend on repository paths, SDK bundle layout, and fallback classes;
  it can be promoted to a common Android APK recovery skill only after removing project-specific paths and converting the
  carcontrolpanel-only fallbacks into generic diagnostic decision points.
---

# Android APK Build Recovery

Use this skill when the user asks to build an APK and the normal Gradle build is blocked by local Huawei/CDC SDK dependencies or packaging issues.

## Fast Path

1. Set the Android SDK path in `local.properties`:

   ```properties
   sdk.dir=C:/Users/Administrator/AppData/Local/Android/Sdk
   ```

2. Use Android Studio JBR if Java is not on `PATH`:

   ```powershell
   $env:JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'
   $env:Path="$env:JAVA_HOME/bin;$env:Path"
   $env:ANDROID_HOME='C:/Users/Administrator/AppData/Local/Android/Sdk'
   $env:ANDROID_SDK_ROOT='C:/Users/Administrator/AppData/Local/Android/Sdk'
   ```

3. Build release first to expose dependency/resource problems:

   ```powershell
   ./gradlew.bat --stop
   ./gradlew.bat :app:assembleRelease --rerun-tasks
   ```

4. If the user needs an installable APK, build debug too:

   ```powershell
   $env:GRADLE_OPTS='-Xmx4096m'
   ./gradlew.bat :app:assembleDebug
   ```

5. Verify output by checking the file directly, not only via workspace search:

   - Release unsigned: `app/build/outputs/apk/release/app-release-unsigned.apk`
   - Debug installable: `app/build/outputs/apk/debug/app-debug.apk`

## Local CDC SDK Dependencies

When dependencies are under `D:/tools/CDC-PRACTICE/SDK`, first determine whether the directory contains actual `.aar`/`.jar` files, not only `.pom` files.

The CDC SDK can use nonstandard layouts such as:

```text
UIkits/hwbutton-car/1.1.1.317/hwbutton-car-1.1.1.317.aar
车控/控制中心/qsplugin-4.0.3.jar
车控/车控APP/车控易用性新UX SDK/依赖包/hmi-config-0.0.1-SNAPSHOT.aar
```

Standard Maven repositories cannot resolve these reliably. Add a recursive `flatDir` repository in `settings.gradle`:

```groovy
def cdcSdkDir = file('D:/tools/CDC-PRACTICE/SDK')
def cdcSdkArtifactDirs = []
if (cdcSdkDir.exists()) {
    cdcSdkDir.eachFileRecurse { artifact ->
        if (artifact.isFile() && (artifact.name.endsWith('.aar') || artifact.name.endsWith('.jar'))) {
            cdcSdkArtifactDirs << artifact.parentFile
        }
    }
}
if (!cdcSdkArtifactDirs.isEmpty()) {
    flatDir {
        dirs cdcSdkArtifactDirs.unique()
    }
}
```

Keep `mavenLocal()`, Huawei Maven, Google, and Maven Central after local SDK resolution unless the build requires a different order.

## Known Dependency Fixes

Use these fixes only after the build output proves the exact failure.

- If `hmi-config-0.0.1-SNAPSHOT.aar` exists but Gradle searches for `.jar`, declare it with `@aar` in every module that uses it:

  ```groovy
  implementation 'com.huawei.ivi.hmi:hmi-config:0.0.1-SNAPSHOT@aar'
  compileOnly 'com.huawei.ivi.hmi:hmi-config:0.0.1-SNAPSHOT@aar'
  ```

- If `hwclickanimation:1.1.1.317` is requested but the SDK only has `1.1.1.437`, add a global resolution rule:

  ```groovy
  subprojects {
      configurations.configureEach {
          exclude group: 'com.huawei.animation', module: 'hwdynamicanimation-phone'
          resolutionStrategy.eachDependency { details ->
              if (details.requested.group == 'com.huawei.ui.uikit'
                      && details.requested.name == 'hwclickanimation'
                      && details.requested.version == '1.1.1.317') {
                  details.useVersion '1.1.1.437'
                  details.because 'CDC SDK bundle contains hwclickanimation 1.1.1.437 instead of 1.1.1.317'
              }
          }
      }
  }
  ```

- If `signal-precheck` is absent and the only direct source use is `LoadingSignal`, remove the compile-time import and probe `isLoading()` reflectively. Preserve the default fallback as `false`.

- If `feature.carcontrol` classes are absent from the SDK, do not use `smartcarcontrol-app-release.aar` as a substitute unless it actually contains `com/huawei/icsp/feature/carcontrol/**`. In this repository it contained `com/huawei/hwcarcontrol/**` and pulled in unrelated UI resources.

## Manifest And Resource Fixes

Fix manifest/resource errors at the source indicated by the Gradle message.

- Duplicate permission from an AAR:

  ```xml
  <manifest xmlns:android="http://schemas.android.com/apk/res/android"
      xmlns:tools="http://schemas.android.com/tools">

      <permission
          android:name="huawei.android.permission.HW_SIGNATURE_OR_SYSTEM"
          android:protectionLevel="system|signature"
          tools:replace="android:protectionLevel" />
  </manifest>
  ```

- Missing `androidhwext:anim/dialog_enter` or `dialog_exit` from dependency styles: override the style in app resources and point to local animations.

  ```xml
  <style name="HwAnimation">
      <item name="android:activityOpenEnterAnimation">@anim/dialog_enter</item>
      <item name="android:activityCloseExitAnimation">@anim/dialog_exit</item>
  </style>
  ```

- Missing dependency manifest resources such as `TranslucentStyle`, `hud_switch_title`, or `app_name`: add the smallest compatible app-side resource definitions, then rebuild.

## Verification Checklist

- [ ] `./gradlew.bat :app:assembleRelease --rerun-tasks` completes or the remaining failure is documented.
- [ ] If an installable APK is needed, `./gradlew.bat :app:assembleDebug` completes with `GRADLE_OPTS=-Xmx4096m` when dex merge needs more memory.
- [ ] Confirm APK existence with `Test-Path` or equivalent direct file check.
- [ ] Report whether the APK is unsigned release or debug-signed installable.
- [ ] Run linter/IDE diagnostics on edited Gradle, manifest, resource, and Java files.

## Reporting Template

```markdown
构建结果：成功/失败
命令：<gradle command>
APK：<path>
大小：<bytes or MiB>
说明：release 是 unsigned；可直接安装请使用 debug APK。
剩余风险：<only if applicable>
```
