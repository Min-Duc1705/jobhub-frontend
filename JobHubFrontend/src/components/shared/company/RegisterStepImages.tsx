import React from 'react';

interface RegisterStepImagesProps {
  logoPreview: string | null;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPreviewSrc: (src: string) => void;
  setPreviewOpen: (open: boolean) => void;
  coverPreview: string | null;
  handleCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activityPreviews: string[];
  removeActivityImage: (idx: number) => void;
  handleActivityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RegisterStepImages({
  logoPreview,
  handleLogoChange,
  setPreviewSrc,
  setPreviewOpen,
  coverPreview,
  handleCoverChange,
  activityPreviews,
  removeActivityImage,
  handleActivityChange,
}: RegisterStepImagesProps) {
  return (
    <div className="cr-card">
      <div className="cr-card__header">
        <span className="material-symbols-outlined">add_a_photo</span>
        <h2>Hình ảnh &amp; Thương hiệu</h2>
      </div>

      <div className="cr-upload-row">
        {/* Logo */}
        <div className="cr-upload-logo">
          <label>Logo công ty</label>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="cr-dropzone cr-dropzone--logo">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo preview" />
                  <div className="cr-dropzone__overlay">
                    <span className="material-symbols-outlined">photo_camera</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">upload</span>
                  <span className="cr-dropzone__hint-title">Tải logo lên</span>
                  <span className="cr-dropzone__hint-sub">PNG, JPG (tối đa 2MB)</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
            </div>
            {logoPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewSrc(logoPreview);
                  setPreviewOpen(true);
                }}
                title="Xem ảnh lớn"
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.55)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-in',
                  color: '#fff',
                  zIndex: 10,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  zoom_in
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Cover */}
        <div className="cr-upload-cover">
          <label>Ảnh bìa (hiển thị trên trang công ty)</label>
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <div className="cr-dropzone cr-dropzone--cover">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover preview" />
                  <div className="cr-dropzone__overlay">
                    <span className="material-symbols-outlined">photo_camera</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  <span className="cr-dropzone__hint-title">Thêm ảnh bìa</span>
                  <span className="cr-dropzone__hint-sub">JPG, PNG, WEBP (tối đa 5MB)</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} />
            </div>
            {coverPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewSrc(coverPreview);
                  setPreviewOpen(true);
                }}
                title="Xem ảnh lớn"
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.55)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-in',
                  color: '#fff',
                  zIndex: 10,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  zoom_in
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ảnh hoạt động */}
      <div style={{ marginTop: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#1b1c1c', marginBottom: 8 }}>
          Ảnh văn phòng / hoạt động
          <span style={{ fontWeight: 400, color: '#747783', marginLeft: 8 }}>
            ({activityPreviews.length}/4 ảnh)
          </span>
        </label>
        <div className="cr-activity-grid">
          {activityPreviews.map((src, idx) => (
            <div key={idx} className="cr-activity-item">
              <img src={src} alt={`Ảnh hoạt động ${idx + 1}`} />
              <button
                type="button"
                className="cr-activity-remove"
                onClick={() => removeActivityImage(idx)}
                title="Xoá ảnh"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
          {activityPreviews.length < 4 && (
            <label className="cr-activity-add">
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <span>Thêm ảnh</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleActivityChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#747783', marginTop: 6 }}>
          Tối đa 4 ảnh · JPG, PNG, WEBP · Mỗi ảnh tối đa 5MB
        </p>
      </div>
    </div>
  );
}
