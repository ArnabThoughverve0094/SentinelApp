const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let content = fs.readFileSync(podfilePath, 'utf-8');

      // This logic disables the strict header check for RNFB targets via build settings
      const modularFix = `
    installer.pod_targets.each do |pod|
      if pod.name.start_with?('RNFB')
        pod.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end`;

      // Inject into the post_install block
      if (!content.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        content = content.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${modularFix}`
        );
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};