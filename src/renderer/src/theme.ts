const dark = {
  colors: {
    primary: '#4391BF',
    error: 'red',
    success: 'lime',

    bg: {
      primary: '#262626',
      secondary: '#121111',
      hover: 'rgba(38,38,38,0.5)',
      active: 'rgba(38,38,38,0.9)',
      btn: '#4391BF',
      btnHover: '#3594cc',
      btnActive: '#1c93d9',
    },

    border: {
      primary: '#666666',
    },

    text: {
      primary: '#f2f2f2',
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
    primary: '#4391BF',
    error: 'red',
    success: 'lime',

    bg: {
      primary: '#f2f2f2',
      secondary: '#e7e7e7',
      hover: '#cfcfcf',
      active: '#c2c2c2',
      btn: '#4391BF',
      btnHover: '#3594cc',
      btnActive: '#1c93d9',
    },

    border: {
      primary: '#c2c2c2',
    },

    text: {
      primary: 'black',
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

const getTheme = () => {
  //TODO Тут нужно откуда-нибудь достать тему

  return dark;
};

export default getTheme();
