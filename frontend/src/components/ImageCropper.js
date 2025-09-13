import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ 
    unit: '%', 
    width: 90, 
    height: 90, 
    x: 5, 
    y: 5 
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop,
          'cropped-image.jpg'
        );
        onCropComplete(croppedImageBlob);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  };

  return (
    <div className="cropper-modal">
      <div className="cropper-content">
        <h3>Crop Image</h3>
        <div className="cropper-container">
          <ReactCrop
            crop={crop}
            onChange={(newCrop) => setCrop(newCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Square aspect ratio, remove for freeform
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              onLoad={() => setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 })}
            />
          </ReactCrop>
        </div>
        <div className="cropper-controls">
          <button onClick={onCancel} className="btn">
            Cancel
          </button>
          <button 
            onClick={handleCropComplete} 
            className="btn btn-primary"
            disabled={!completedCrop}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;