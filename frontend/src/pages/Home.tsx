import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useUploadImagesMutation, useFetchImagesQuery } from '../api/authApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './BulkImageUpload.css'
import { AiOutlineLogout } from "react-icons/ai";
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../api/authSlice';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'
import ImageItem from './ImageItem';








const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user?.name);
  console.log(user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(clearAuth());  
    Cookies.remove('token'); 
    navigate('/', { replace: true }); 
  };

  useEffect(() => {
    window.onpopstate = () => {

      navigate('/home');
    };
  }, [navigate]);
  
  
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold">Stock Image</div>
        <div className="hidden md:flex space-x-4 text-white text-2xl">
          <p className='text-sm'>Hey {user}</p>
          <button onClick={handleLogout}>
            <AiOutlineLogout />
          </button>

        </div>
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden flex flex-col space-y-2 mt-2 text-white text-2xl">
          <p className='text-sm'>Hey {user}</p>
          <button onClick={handleLogout}>
            <AiOutlineLogout />
          </button>

        </div>
      )}
    </nav>
  );
};



const BulkImageUpload: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [uploadImages] = useUploadImagesMutation();
  const [uploading, setUploading] = useState(false);
  const [userImages, setUserImages] = useState<{ _id: string; title: string; imageUrl: string }[]>([]);
  const userId = useSelector((state: RootState) => state.auth.user?._id);
  const { data: images, isLoading, refetch } = useFetchImagesQuery(userId!, { skip: !userId });
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [newFile, setNewFile] = useState<File | undefined>(undefined);




  console.log(userId)

  // Retrieve the token from cookies
  const token = Cookies.get('token') || undefined;

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
      setTitles(Array.from(event.target.files).map(() => ''));
    }
  };

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`https://stockimage-u224.onrender.com/api/users/delete/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete image");
      }
      setUserImages((prevImages) => prevImages.filter((image) => image._id !== imageId));

      refetch();

      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleUpdateImage = async (imageId: string, updatedTitle: string, newFile?: File) => {
    if (!updatedTitle.trim()) {
      toast.error('Title cannot be empty');
      return; 
    }
  
    try {
      const formData = new FormData();
  
      if (newFile) {
        formData.append('file', newFile);
      }
      formData.append('title', updatedTitle);
  
      const response = await fetch(`https://stockimage-u224.onrender.com/api/users/update/${imageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to update image");
      }
  
      // Refresh data after successful update
      refetch();
      toast.success('Image updated successfully!');
  
      // Reset editing state
      setEditingImageId(null);
      setEditedTitle('');
      setNewFile(undefined);
    } catch (error) {
      console.error("Error updating image:", error);
    }
  };
  
  



  const handleUpload = async () => {
    if (!files || titles.length !== files.length) {
      alert('Please select files and enter titles for each image.');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));
    titles.forEach((title) => formData.append('titles', title));

    setUploading(true);

    try {
      const response = await uploadImages({
        formData,
        token,
      }).unwrap();
      console.log('rerere:', response);


      toast.success('Images uploaded successfully!');

      refetch();  
      setUploading(false);

    } catch (error: any) {
      console.error('Error uploading files:', error);
      alert(`Error uploading files: ${error.data?.error || 'Bad Request'}`);
    } finally {
      setUploading(false);
    }
  };



  const fetchUserImages = async () => {
    try {
      const response = await fetch('https://stockimage-u224.onrender.com/api/users/images', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUserImages(data);
    } catch (error) {
      console.error('Error fetching user images:', error);
    }
  };

  useEffect(() => {
    fetchUserImages();
  }, [userId]);


  useEffect(() => {
    if (images) {
      setUserImages(images);
    }
  }, [images]);

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...userImages];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setUserImages(updatedImages);
  };

  const handleSaveOrder = async () => {
    const updatedOrder = userImages.map((image, index) => ({
      _id: image._id,
      order: index,
    }));

    try {
      const response = await fetch(`https://stockimage-u224.onrender.com/api/users/update-order`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify(updatedOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to update image order');
      }
      toast.success('Image order updated successfully!');
    } catch (error) {
      console.error('Error updating image order:', error);
    }
  };



  return (
    <>
      <Header />
      <DndProvider backend={HTML5Backend}>
        <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
          <h2 className="text-3xl font-bold text-center mb-6">Bulk Image Upload</h2>
          <input
            type="file"
            multiple
            onChange={handleFilesChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:cursor-pointer hover:file:bg-gray-100 focus:file:ring-2 focus:file:ring-blue-300"
          />
          {files && Array.from(files).map((file, index) => (
            <div key={index} className="mt-4 flex items-center">
              <label className="flex-1 text-sm text-gray-700">{file.name}</label>
              <input
                type="text"
                placeholder="Enter title"
                value={titles[index]}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className="ml-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition duration-200"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>


        <div className="container mx-auto mt-12 px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Your Image Gallery</h1>

          {isLoading && <p className="text-center">Loading images...</p>}
          {images && images.length === 0 && <p className="text-center text-gray-500">No images found.</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {userImages.map((image, index) => (
  <div key={image._id}>
    {editingImageId === image._id ? (
      <>
        <input
          type="text"
          placeholder="Edit title"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setNewFile(e.target.files?.[0])}
        />
        <button onClick={() => handleUpdateImage(image._id, editedTitle, newFile)}>Save</button>
      </>
    ) : (
      <ImageItem
        image={image}
        index={index}
        moveImage={moveImage}
        handleUpdateImage={handleUpdateImage}
        handleDeleteImage={handleDeleteImage}
      />
    )}
  </div>
))}

          </div>

          <div className="text-center mb-10">
            <button
              onClick={handleSaveOrder}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition duration-200"
            >
              Save Order
            </button>
          </div>


        </div>
      </DndProvider>
    </>
  );



};

export default BulkImageUpload;






