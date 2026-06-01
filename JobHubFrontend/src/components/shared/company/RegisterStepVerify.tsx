import React from 'react';
import type { FormInstance } from 'antd';

const COMPANY_SIZE_OPTIONS = [
  { value: 'STARTUP',    label: 'Startup (< 50 nhân viên)'     },
  { value: 'SME',        label: 'Vừa và nhỏ (50 – 500)'        },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp lớn (> 500)'     },
];

interface RegisterStepVerifyProps {
  form: FormInstance;
  logoPreview: string | null;
  coverPreview: string | null;
}

export default function RegisterStepVerify({ form, logoPreview, coverPreview }: RegisterStepVerifyProps) {
  const selectedIndustryVal = form.getFieldValue('industry');
  const industryText = selectedIndustryVal === 'Khác' ? form.getFieldValue('customIndustry') : selectedIndustryVal;

  return (
    <>
      <div className="cr-verify-card">
        <div className="cr-verify-card__icon">
          <span className="material-symbols-outlined">shield_person</span>
        </div>
        <div className="cr-verify-card__body">
          <h3>Xác thực doanh nghiệp</h3>
          <p>
            Sau khi bạn gửi đăng ký, Admin JobHub sẽ xem xét và xác minh
            thông tin công ty. Công ty chỉ xuất hiện công khai sau khi được duyệt.
          </p>
          <ul className="cr-verify-list">
            <li>
              <span className="material-symbols-outlined">check_circle</span>
              Thông tin công ty sẽ được xem xét trong vòng 1–3 ngày làm việc
            </li>
            <li>
              <span className="material-symbols-outlined">check_circle</span>
              Bạn sẽ nhận thông báo khi công ty được xác minh thành công
            </li>
            <li>
              <span className="material-symbols-outlined">check_circle</span>
              Sau xác minh, bạn có thể đăng tin tuyển dụng ngay lập tức
            </li>
          </ul>
        </div>
      </div>

      {/* Summary */}
      <div className="cr-card">
        <div className="cr-card__header">
          <span className="material-symbols-outlined">summarize</span>
          <h2>Xem lại thông tin</h2>
        </div>

        {/* Company identity row: logo + name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%)',
          borderRadius: 10, marginBottom: 20,
          border: '1px solid #dce8ff',
        }}>
          {logoPreview ? (
            <img src={logoPreview} alt="logo" style={{
              width: 56, height: 56, objectFit: 'cover',
              borderRadius: 10, border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 10,
              background: '#e3e2e2', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ color: '#747783', fontSize: 26 }}>domain</span>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: '#1b1c1c', lineHeight: 1.3 }}>
              {form.getFieldValue('name') || <span style={{ color: '#c3c6d3' }}>Chưa điền tên</span>}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#747783', marginTop: 3 }}>
              {industryText || <span style={{ color: '#c3c6d3' }}>Chưa chọn lĩnh vực</span>}
            </p>
          </div>
        </div>

        {/* Info grid 2 cols */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 16 }}>
          {[
            {
              icon: 'business_center',
              label: 'Quy mô',
              value: COMPANY_SIZE_OPTIONS.find(o => o.value === form.getFieldValue('companySize'))?.label
            },
            { icon: 'mail', label: 'Email liên hệ', value: form.getFieldValue('contactEmail') },
            { icon: 'language', label: 'Website', value: form.getFieldValue('website') },
            { icon: 'receipt_long', label: 'Mã số thuế', value: form.getFieldValue('taxCode') },
            { icon: 'location_on', label: 'Địa chỉ', value: form.getFieldValue('address') },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px',
              background: '#faf9f9',
              borderRadius: 8,
              border: '1px solid #efeded',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#e8f0fe', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#002660', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#747783', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, color: value ? '#1b1c1c' : '#c3c6d3', fontWeight: value ? 600 : 400, marginTop: 2 }}>
                  {value || 'Chưa điền'}
                </p>
              </div>
            </div>
          ))}

          {/* Ảnh bìa */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px',
            background: '#faf9f9',
            borderRadius: 8,
            border: '1px solid #efeded',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#e8f0fe', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#002660', fontVariationSettings: "'FILL' 1" }}>add_photo_alternate</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#747783', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Ảnh bìa</p>
              {coverPreview ? (
                <img src={coverPreview} alt="cover" style={{ marginTop: 6, width: 80, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e3e2e2' }} />
              ) : (
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#c3c6d3' }}>Chưa tải lên</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: '#fff8e6', borderRadius: 8,
          border: '1px solid #ffe7a0',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#d48806', fontVariationSettings: "'FILL' 1" }}>schedule</span>
          <span style={{ fontSize: 13, color: '#875800', fontWeight: 500 }}>
            Sau khi gửi, công ty sẽ ở trạng thái <strong>Chờ xác minh</strong> cho đến khi Admin duyệt.
          </span>
        </div>
      </div>
    </>
  );
}
