import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MdDelete, MdEdit } from 'react-icons/md';

interface ImageItemProps {
  image: { _id: string; title: string; imageUrl: string };
  index: number;
  moveImage: (fromIndex: number, toIndex: number) => void;
  handleDeleteImage: (imageId: string) => void;
  handleUpdateImage: (imageId: string, updatedTitle: string, newFile?: File) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, index, moveImage, handleDeleteImage, handleUpdateImage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(image.title);
  const [newFile, setNewFile] = useState<File | undefined>(undefined);


  const [{ isDragging }, dragRef] = useDrag({
    type: 'IMAGE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: 'IMAGE',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveImage(draggedItem.index, index);
        draggedItem.index = index; 
      }
    },
  });

  const handleSave = () => {
    handleUpdateImage(image._id, editedTitle, newFile);
    setIsEditing(false);
  };

  return (
    <div
      ref={(node) => dragRef(dropRef(node))} 
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${isDragging ? 'opacity-50' : ''}`} 
      style={{ cursor: 'move' }}
    >
      <div className="relative group">
        <img src={image.imageUrl} alt={image.title} className="w-full h-40 object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-lg">{image.title}</span>
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <>
     
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 mb-2 w-full"
              placeholder="Enter new title"
            />
            <input
              type="file"
              onChange={(e) => e.target.files && setNewFile(e.target.files[0])}
              className="border border-gray-300 rounded-lg p-2 mb-2 w-full"
            />
            <button
              onClick={handleSave}
              className="mt-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition duration-200"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="ml-2 mt-2 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 focus:ring-2 focus:ring-gray-300 transition duration-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 truncate">{image.title}</h4>
            <div className="flex items-center space-x-4">

              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-800 hover:text-gray-950 transition duration-200"
                title="Edit"
              >
                <MdEdit size={20} />
              </button>

   
              <button
                onClick={() => handleDeleteImage(image._id)}
                className="text-gray-800 hover:text-red-600 transition duration-200"
                title="Delete"
              >
                <MdDelete size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageItem;
