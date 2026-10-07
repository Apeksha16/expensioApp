/**
 * Expo config plugin: makes Xcode's "Run" (▶) action use the Release
 * configuration by default for the iOS scheme.
 *
 * Why: `npx expo prebuild --clean` regenerates the ios/ folder and resets the
 * scheme back to Debug, which requires the Metro bundler ("No script URL
 * provided"). Release builds embed the JS bundle inside the app, so it runs
 * standalone on the device without the same Wi-Fi / Metro dependency.
 *
 * Because this lives in app.json plugins, it is re-applied on every prebuild.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

function setLaunchConfiguration(schemeXml, configuration) {
  // Only touch the <LaunchAction ...> opening tag (what Xcode's Run button uses).
  return schemeXml.replace(/<LaunchAction\b[^>]*>/, (tag) =>
    tag.replace(/buildConfiguration\s*=\s*"[^"]*"/, `buildConfiguration = "${configuration}"`)
  );
}

module.exports = function withReleaseScheme(config, { configuration = 'Release' } = {}) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const projectName = cfg.modRequest.projectName;
      const schemesDir = path.join(
        iosRoot,
        `${projectName}.xcodeproj`,
        'xcshareddata',
        'xcschemes'
      );

      if (!fs.existsSync(schemesDir)) return cfg;

      for (const file of fs.readdirSync(schemesDir)) {
        if (!file.endsWith('.xcscheme')) continue;
        const schemePath = path.join(schemesDir, file);
        const original = fs.readFileSync(schemePath, 'utf8');
        const updated = setLaunchConfiguration(original, configuration);
        if (updated !== original) fs.writeFileSync(schemePath, updated);
      }
      return cfg;
    },
  ]);
};
