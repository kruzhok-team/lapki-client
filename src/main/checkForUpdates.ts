import { compare } from 'compare-versions';

import { autoUpdateHost, forceUpdateLink } from './version';

export const checkForUpdates = (version: string) => async () => {
  if (!autoUpdateHost) return false;
  try {
    const response = await fetch(autoUpdateHost, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch latest release: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    if (!data.tag_name || typeof data.tag_name !== 'string') {
      console.error('Failed to fetch latest release: tag_name is missing or not a string');
      return false;
    }

    // Extract version number from tag_name, handling possible prefixes like "release-v0.5.0"
    const match = (data.tag_name as string).match(/v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)/i);
    const latestReleaseVersion = match ? match[1] : '';
    if (!latestReleaseVersion) {
      console.error("Failed to fetch latest release: can't extract version from ", data.tag_name);
      return false;
    }

    // console.log(`Latest release version: ${latestReleaseVersion}, current version: ${version}`);

    if (compare(latestReleaseVersion, version, '>')) {
      const updateUrl = forceUpdateLink || (data.html_url as string);
      return {
        name: data.name as string,
        url: updateUrl,
      };
    }

    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
