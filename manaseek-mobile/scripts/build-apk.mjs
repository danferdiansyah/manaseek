import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("..", import.meta.url));
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  [
    path.join(homedir(), "Library/Android/sdk"),
    path.join(homedir(), "Android/Sdk"),
    "/opt/homebrew/share/android-commandlinetools",
    "/usr/local/share/android-commandlinetools",
  ].find(existsSync);

if (!sdk || !existsSync(path.join(sdk, "platforms", "android-36"))) {
  throw new Error(
    "Install Android SDK platform 36 and set ANDROID_HOME. See README.md.",
  );
}

const architectures = process.env.ANDROID_ABIS || "arm64-v8a,armeabi-v7a";
const supported = new Set(["arm64-v8a", "armeabi-v7a", "x86", "x86_64"]);
if (architectures.split(",").some((abi) => !supported.has(abi))) {
  throw new Error(
    "ANDROID_ABIS must be a comma-separated list of Android ABIs.",
  );
}

const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  NODE_ENV: "production",
  CI: "1",
};
function run(command, args, cwd = project) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run(process.execPath, [
  "node_modules/expo/bin/cli",
  "prebuild",
  "--platform",
  "android",
  "--no-install",
]);
run(
  "./gradlew",
  [
    ":app:assembleRelease",
    `-PreactNativeArchitectures=${architectures}`,
    "--max-workers=2",
    "--console=plain",
  ],
  path.join(project, "android"),
);

const release = path.join(project, "android/app/build/outputs/apk/release");
const metadata = JSON.parse(
  readFileSync(path.join(release, "output-metadata.json"), "utf8"),
);
const [artifact] = metadata.elements;
if (metadata.elements.length !== 1 || artifact.filters.length !== 0) {
  throw new Error("Expected one universal APK containing the selected ABIs.");
}
const filename = `manaseek-${artifact.versionName}.apk`;
const output = path.join(project, "out/android");
mkdirSync(output, { recursive: true });
const apk = path.join(output, filename);
copyFileSync(path.join(release, artifact.outputFile), apk);
const checksum = createHash("sha256").update(readFileSync(apk)).digest("hex");
writeFileSync(`${apk}.sha256`, `${checksum}  ${filename}\n`);
console.log(`\nAPK: ${apk}\nABIs: ${architectures}\nSHA-256: ${checksum}`);
console.log(
  "Internal testing only: uses the Expo template debug signing certificate.",
);
