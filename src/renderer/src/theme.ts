const dark = {
  colors: {
    primary: '#0C4BEE',
    error: 'red',
    success: 'lime',

    primaryHover: '#225EF9',
    primaryActive: '#2A62F4',

    bg: {
      primary: '#262626',
      secondary: '#121111',
      hover: '#434343',
      active: '#545454',
    },

    border: {
      primary: '#666666',
    },

    text: {
      primary: '#f2f2f2',
      secondary: '#fff',
      inactive: '#a3a2a2',
      disabled: 'rgb(156,163,175)',
    },

    diagram: {
      state: {
        bodyBg: '#404040',
        titleColor: '#FFF',
        titleBg: '#525252',
        eventColor: '#FFF',
        selectedBorderColor: '#FFF',
      },
    },
  },
};

const light = {
  colors: {
    primary: '#0C4BEE',
    error: 'red',
    success: 'lime',

    primaryHover: '#225EF9',
    primaryActive: '#2A62F4',

    bg: {
      primary: '#e7e7e7',
      secondary: '#f2f2f2',
      hover: '#cfcfcf',
      active: '#c2c2c2',
    },

    border: {
      primary: '#c2c2c2',
    },

    text: {
      primary: '#000',
      secondary: '#fff',
      inactive: '#b3b2b2',
      disabled: 'rgb(156,163,175)',
    },

    diagram: {
      state: {
        bodyBg: '#404040',
        titleColor: '#FFF',
        titleBg: '#525252',
        eventColor: '#FFF',
        selectedBorderColor: '#FFF',
      },
    },
  },
};

const getTheme = () => {
  //TODO Тут нужно откуда-нибудь достать тему

  return light;
};

export default getTheme();
