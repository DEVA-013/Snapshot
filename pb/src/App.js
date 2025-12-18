import { useState, useRef } from "react";
import Webcam from "react-webcam";
import html2canvas from "html2canvas";
import "./App.css";

function App() {
  const [polaroidCount, setPolaroidCount] = useState(3);
  const [photos, setPhotos] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("none");
  const [layout, setLayout] = useState("classic");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const webcamRef = useRef(null);
  const stripRef = useRef(null);

  const filters = {
    none: "none",
    vintage: "sepia(100%) contrast(1.2) brightness(1.1)",
    blackwhite: "grayscale(100%)",
    warm: "brightness(1.1) saturate(1.3) contrast(1.2)",
    cool: "hue-rotate(180deg) saturate(1.2)",
    bright: "brightness(1.3) contrast(1.2) saturate(1.4)",
    dramatic: "contrast(1.5) brightness(0.9) saturate(1.3)",
    soft: "brightness(1.2) contrast(0.9) saturate(0.8) blur(0.5px)"
  };

  // Process image: ALWAYS mirror it and apply filter to match camera view
  const processImage = (imageSrc, filterStyle) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        // Set up transform to mirror horizontally (flip left-right)
        // This matches what the user sees in the mirrored camera view
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Apply filter while drawing
        if (filterStyle !== "none") {
          ctx.filter = filters[filterStyle];
        }
        
        // Draw the image (will be mirrored and filtered)
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        console.error("Failed to load image for processing");
        resolve(imageSrc);
      };
      img.src = imageSrc;
    });
  };

  const capture = async () => {
    if (photos.length >= polaroidCount) {
      setPhotos([]);
      return;
    }

    const img = webcamRef.current.getScreenshot();
    // Process image: mirror it to match camera view and apply filter
    const processedImg = await processImage(img, currentFilter);
    setPhotos([...photos, processedImg]);
  };

  const downloadStrip = async () => {
    if (photos.length === 0) return;
    
    const canvas = await html2canvas(stripRef.current, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true
    });
    const link = document.createElement("a");
    link.download = `snapshot_photobooth_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const resetPhotos = () => {
    setPhotos([]);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    setPhotos(newPhotos);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isComplete = photos.length === polaroidCount;

  return (
    <div className="container">
      <div className="booth-card">
        <div className="title">✨ SnapShot ✨</div>
        
        <div className="camera-wrapper">
          <Webcam
            ref={webcamRef}
            mirrored={false}
            screenshotFormat="image/png"
            className="camera"
            style={{ filter: filters[currentFilter] }}
          />
          <div className="camera-overlay">📷</div>
        </div>

        <div className="photo-preview-section">
          {photos.map((photo, index) => (
            <div key={index} className="preview-photo-wrapper">
              <img 
                src={photo} 
                alt={`Preview ${index + 1}`} 
                className="preview-photo"
              />
              <div className="photo-number">{index + 1}</div>
            </div>
          ))}
          {Array.from({ length: polaroidCount - photos.length }).map((_, index) => (
            <div key={`empty-${index}`} className="preview-photo-wrapper empty">
              <div className="empty-placeholder">+</div>
            </div>
          ))}
        </div>

        <div className="controls-section">
          <div className="control-group">
            <label>Polaroids:</label>
            <select 
              value={polaroidCount} 
              onChange={(e) => {
                setPolaroidCount(Number(e.target.value));
                if (photos.length > Number(e.target.value)) {
                  setPhotos(photos.slice(0, Number(e.target.value)));
                }
              }}
              className="control-select"
            >
              <option value={1}>1 Photo</option>
              <option value={2}>2 Photos</option>
              <option value={3}>3 Photos</option>
              <option value={4}>4 Photos</option>
              <option value={5}>5 Photos</option>
              <option value={6}>6 Photos</option>
            </select>
          </div>

          <div className="control-group">
            <label>Filter:</label>
            <select 
              value={currentFilter} 
              onChange={(e) => setCurrentFilter(e.target.value)}
              className="control-select"
            >
              <option value="none">None</option>
              <option value="vintage">Vintage</option>
              <option value="blackwhite">B&W</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="bright">Bright</option>
              <option value="dramatic">Dramatic</option>
              <option value="soft">Soft</option>
            </select>
          </div>

          <div className="control-group">
            <label>Layout:</label>
            <select 
              value={layout} 
              onChange={(e) => setLayout(e.target.value)}
              className="control-select"
            >
              <option value="classic">Classic</option>
              <option value="polaroid">Polaroid</option>
              <option value="vintage">Vintage Strip</option>
              <option value="modern">Modern</option>
              <option value="elegant">Elegant</option>
            </select>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={capture} 
            className={`capture-btn ${isComplete ? 'complete' : ''}`}
          >
            {isComplete ? '🔄 Reset & Capture' : `📸 Capture (${photos.length}/${polaroidCount})`}
          </button>
          
          {photos.length > 0 && (
            <button onClick={resetPhotos} className="reset-btn">
              Clear All
            </button>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="strip-wrapper">
          <div className="rearrange-hint">
            💡 Drag photos to rearrange
          </div>
          <div className={`strip ${layout}`} ref={stripRef}>
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`strip-photo-container ${layout} ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="strip-photo"
                />
                {layout === "polaroid" && <div className="polaroid-label"></div>}
              </div>
            ))}
          </div>

          <button className="download-btn" onClick={downloadStrip}>
            ⬇️ Download Strip
          </button>
        </div>
      )}
    </div>
  );
}

export default App;