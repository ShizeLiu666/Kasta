import React from 'react';
import { Link } from 'react-router-dom';

const FileUploadPage = () => {
  const handleFileChange = (e) => {
    // 处理文件变化
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // 处理文件拖放
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ background: '#edf2f7', position: 'relative' }}>
      <div className="absolute inset-0 bg-no-repeat bg-cover" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: 'cover' }}>
        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
      </div>
      <div className="relative h-auto w-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full p-10 bg-white rounded-xl z-10 relative overflow-hidden" style={{ maxWidth: '550px' }}>
          <Link to="/project_list" className="absolute top-5 left-5" style={{ color: '#FBCD0B' }}>
            Go to Poject List
          </Link>
          <div className="text-center">
            <h2 className="mt-10 text-3xl font-bold text-gray-900">
              File Upload
            </h2>
            <p className="mt-2 text-sm text-gray-400">placeholder text</p>
          </div>
          <form className="mt-8 space-y-3" action="#" method="POST">
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-sm font-bold text-gray-500 tracking-wide">Title</label>
              <input className="text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" type="email" placeholder="mail@gmail.com" />
            </div>
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-sm font-bold text-gray-500 tracking-wide">Attach Document</label>
              <div className="flex items-center justify-center w-full">
                <label
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="flex flex-col rounded-lg border-4 border-dashed w-full h-60 p-10 group text-center"
                >
                  <div className="h-full w-full text-center flex flex-col items-center justify-center">
                    <div className="flex flex-auto max-h-48 w-2/5 mx-auto -mt-10">
                      <img className="has-mask h-36 object-center" src="https://img.freepik.com/free-vector/image-upload-concept-landing-page_52683-27130.jpg?size=338&ext=jpg" alt="upload illustration" />
                    </div>
                    <p className="pointer-none text-gray-500"><span className="text-sm">Drag and drop</span> files here <br /> or <span className="text-blue-600 hover:underline cursor-pointer">select a file</span> from your computer</p>
                  </div>
                  <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              <span>File type: doc,pdf,types of images</span>
            </p>
            <div>
              <button type="submit" className="my-5 w-full flex justify-center text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-yellow-600 shadow-lg cursor-pointer transition ease-in duration-300" style={{ backgroundColor: '#FBCD0B' }}>
                Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FileUploadPage;