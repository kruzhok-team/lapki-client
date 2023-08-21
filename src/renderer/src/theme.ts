const dark = {
  colors: {
    primary: '#e35e17',
    error: 'red',
    success: 'lime',

    bg: {
      primary: '#262626',
      secondary: '#121111',
      hover: 'rgba(38,38,38,0.5)',
      active: 'rgba(38,38,38,0.9)',
      btn: '#e35e17',
      btnHover: '#f26a22',
      btnActive: '#ed5809',
    },

    border: {
      primary: '#666666',
    },

    text: {
      primary: '#f2f2f2',
      inactive: '#a3a2a2',
      disabled: 'rgb(156,163,175)',
    },
  },
};

const getTheme = () => {
  //TODO Тут нужно откуда-нибудь достать тему

  return dark;
};

export default getTheme();
