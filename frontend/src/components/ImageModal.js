import React, { useState, useRef, useEffect } from 'react';
import ReactModal from 'react-modal';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageModal.css';

// Set the app element for react-modal
if (typeof window !== 'undefined') {
  ReactModal.setAppElement('#root');
}

const ImageModal = ({ image, isOpen, onClose, onSave }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ unit: 'px', width: 200, height: 200, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  
  const imgRef = useRef(null);

  useEffect(() => {
    if (isOpen && image) {
      setImageLoaded(false);
      setCropMode(false);
      setRotation(0);
      setScale(1);
      setCrop({ unit: 'px', width: 200, height: 200, x: 0, y: 0 });
      setCurrentImageSrc(image.file_path);
    }
  }, [isOpen, image]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image');
    setImageLoaded(false);
  };

  const handleRotate = (degrees) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  const handleResize = () => {
    const newScale = prompt('Enter scale factor (0.1 to 5):', scale);
    if (newScale && !isNaN(newScale)) {
      const scaleValue = parseFloat(newScale);
      if (scaleValue >= 0.1 && scaleValue <= 5) {
        setScale(scaleValue);
      } else {
        alert('Scale must be between 0.1 and 5');
      }
    }
  };

  // Create a CORS-friendly version of the image
  const fetchImageWithCORS = async (url) => {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
      // Fallback to original URL
      return url;
    }
  };

  const getCroppedImg = async (imageElement, crop) => {
    try {
      // Create a CORS-friendly version of the image
      const corsImageUrl = await fetchImageWithCORS(imageElement.src);
      
      return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const scaleX = image.naturalWidth / imageElement.width;
          const scaleY = image.naturalHeight / imageElement.height;

          canvas.width = crop.width;
          canvas.height = crop.height;

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

          resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = () => {
          // Fallback: try to crop without CORS (may not work)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const scaleX = imageElement.naturalWidth / imageElement.width;
          const scaleY = imageElement.naturalHeight / imageElement.height;

          canvas.width = crop.width;
          canvas.height = crop.height;

          try {
            ctx.drawImage(
              imageElement,
              crop.x * scaleX,
              crop.y * scaleY,
              crop.width * scaleX,
              crop.height * scaleY,
              0,
              0,
              crop.width,
              crop.height
            );
            resolve(canvas.toDataURL('image/png'));
          } catch (error) {
            console.error('Crop failed:', error);
            resolve(null);
          }
        };
        image.src = corsImageUrl;
      });
    } catch (error) {
      console.error('Error in getCroppedImg:', error);
      return null;
    }
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
      
      if (croppedImage) {
        // Update the image source with the cropped version
        setCurrentImageSrc(croppedImage);
        setCropMode(false);
        setRotation(0);
        setScale(1);
      } else {
        alert('Crop failed due to CORS restrictions. The image may need to be served with proper CORS headers.');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!imgRef.current) return;
    
    try {
      // Create a CORS-friendly version of the current image
      const corsImageUrl = await fetchImageWithCORS(imgRef.current.src);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create a canvas to apply transformations
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions
          canvas.width = img.naturalWidth * scale;
          canvas.height = img.naturalHeight * scale;
          
          // Apply transformations
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
          
          const dataURL = canvas.toDataURL('image/png');
          onSave({
            imageData: dataURL,
            filename: image.filename
          });
        } catch (error) {
          console.error('Error in canvas operations:', error);
          alert('Error saving image. This may be due to CORS restrictions.');
        }
      };
      
      img.onerror = () => {
        // Fallback: try to save without CORS (may not work)
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const currentImg = imgRef.current;
          
          canvas.width = currentImg.naturalWidth * scale;
          canvas.height = currentImg.naturalHeight * scale;
          
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);
          ctx.drawImage(currentImg, -currentImg.naturalWidth / 2, -currentImg.naturalHeight / 2);
          
          const dataURL = canvas.toDataURL('image/png');
          onSave({
            imageData: dataURL,
            filename: image.filename
          });
        } catch (fallbackError) {
          console.error('Fallback save failed:', fallbackError);
          alert('Unable to save image due to CORS restrictions. The image server needs to allow cross-origin access.');
        }
      };
      
      img.src = corsImageUrl;
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Error saving image. Please try again.');
    }
  };

  const resetTransformations = () => {
    setRotation(0);
    setScale(1);
    if (image) {
      setCurrentImageSrc(image.file_path);
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="image-modal"
      overlayClassName="image-modal-overlay"
      shouldCloseOnOverlayClick={false}
    >
      <div className="modal-header">
        <h3>Edit Image: {image?.title || image?.original_filename}</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="modal-content">
        <div className="toolbar">
          <div className="tool-group">
            <button onClick={() => handleRotate(90)} className="btn">
              🔄 Rotate 90°
            </button>
            <button onClick={() => handleRotate(-90)} className="btn">
              🔄 Rotate -90°
            </button>
            <button onClick={handleResize} className="btn">
              📏 Resize
            </button>
            <button 
              onClick={() => setCropMode(!cropMode)} 
              className={cropMode ? 'btn active' : 'btn'}
            >
              ✂️ {cropMode ? 'Cancel Crop' : 'Crop'}
            </button>
            <button onClick={resetTransformations} className="btn">
              🔄 Reset
            </button>
          </div>

          {cropMode && (
            <div className="crop-controls">
              <button onClick={handleCropComplete} className="btn btn-primary">
                Apply Crop
              </button>
            </div>
          )}
        </div>

        <div className="canvas-container">
          {!imageLoaded && (
            <div className="loading">Loading image...</div>
          )}
          
          {cropMode ? (
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCompletedCrop}
              keepSelection={true}
            >
              <img
                ref={imgRef}
                src={currentImageSrc}
                alt={image?.alt_text || image?.title || image?.original_filename}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  display: imageLoaded ? 'block' : 'none',
                  margin: '0 auto',
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center'
                }}
              />
            </ReactCrop>
          ) : (
            <img
              ref={imgRef}
              src={currentImageSrc}
              alt={image?.alt_text || image?.title || image?.original_filename}
              onLoad={handleImageLoad}
              onError={handleImageError}
              crossOrigin="anonymous"
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                display: imageLoaded ? 'block' : 'none',
                margin: '0 auto',
                transform: `rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center'
              }}
            />
          )}
        </div>
      </div>

      <div className="modal-footer">
        <div className="image-info">
          {image && (
            <>
              <span>Original: {image.width}×{image.height}</span>
              <span>Rotation: {rotation}°</span>
              <span>Scale: {scale}x</span>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default ImageModal;