const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let content = fs.readFileSync(podfilePath, 'utf-8');

      // This uses 'pods_project.targets' which is the most stable accessor in CocoaPods 1.15+
      const firebaseFix = `
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['OTHER_CFLAGS'] = '$(inherited) -Wno-non-modular-include-in-framework-module'
        end
      end
    end`;

      if (!content.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        // Find the post_install block and inject our fix
        content = content.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${firebaseFix}`
        );
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};