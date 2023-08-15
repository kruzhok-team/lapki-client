const Show = ({ html }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
};

export default Show;
