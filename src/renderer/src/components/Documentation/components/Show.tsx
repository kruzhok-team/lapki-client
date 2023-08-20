const Show = ({ html, documentLink }) => {
  return (
    <>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }}></div>
      ) : (
        <div className="bg-gray-200 p-4">
          <h2 className="mb-2 text-xl font-bold">Ссылка на материал</h2>
          <a href={documentLink} target="_blank" className="text-blue-500 hover:text-blue-700">
            {documentLink}
          </a>
        </div>
      )}
    </>
  );
};

export default Show;
