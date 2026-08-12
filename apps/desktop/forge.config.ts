import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Redstone',
    executableName: 'redstone',
    icon: process.platform === 'darwin'
      ? 'assets/icon.icns'
      : process.platform === 'linux'
        ? 'assets/icon.png'
        : undefined,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({ name: 'redstone' }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'redstone',
        bin: 'redstone',
        maintainer: 'Redstone',
        homepage: 'https://redstone.citadel.red',
      },
    }),
    new MakerRpm({
      options: {
        name: 'redstone',
        bin: 'redstone',
        homepage: 'https://redstone.citadel.red',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
