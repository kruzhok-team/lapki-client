import { compare } from 'compare-versions';

export const checkForUpdates = (version: string) => async () => {
  try {
    const response = await fetch(
      'https://api.github.com/repos/kruzhok-team/lapki-client/releases/latest',
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const latestReleaseVersion = (data.tag_name as string).substring(1);

    if (compare(latestReleaseVersion, version, '>')) {
      return {
        name: data.name as string,
        url: data.html_url as string,
      };
    }

    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
