import React from 'react';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { CompanySize } from '../../../types/company';

const { Option } = Select;

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: 'STARTUP',    label: 'Startup (< 50 nhân viên)'     },
  { value: 'SME',        label: 'Vừa và nhỏ (50 – 500)'        },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp lớn (> 500)'     },
];

const INDUSTRY_OPTIONS = [
  'Công nghệ thông tin',
  'Phát triển phần mềm',
  'Thương mại điện tử',
  'Trí tuệ nhân tạo & Data',
  'Tư vấn công nghệ',
  'Tài chính & Ngân hàng',
  'Giáo dục & Đào tạo',
  'Y tế & Chăm sóc sức khỏe',
  'Bán lẻ & Tiêu dùng',
  'Xây dựng & Bất động sản',
  'Logistics & Vận tải',
  'Marketing & Truyền thông',
  'Khác',
];

interface RegisterStepBasicProps {
  form: FormInstance;
  desc: string;
  setDesc: (desc: string) => void;
}

export default function RegisterStepBasic({ form, desc, setDesc }: RegisterStepBasicProps) {
  const selectedIndustry = Form.useWatch('industry', form);
  const showCustomIndustry = selectedIndustry === 'Khác';

  return (
    <div className="cr-card">
      <div className="cr-card__header">
        <span className="material-symbols-outlined">corporate_fare</span>
        <h2>Thông tin cơ bản</h2>
      </div>

      <div className="cr-form-grid">
        {/* Tên công ty */}
        <Form.Item
          name="name"
          label="Tên công ty"
          className="cr-form-grid--full"
          rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
        >
          <Input size="large" placeholder="Ví dụ: Công ty Công nghệ JobHub Việt Nam" />
        </Form.Item>

        {/* Website */}
        <Form.Item name="website" label="Website chính thức">
          <Input
            size="large"
            placeholder="https://jobhub.vn"
            prefix={<span className="material-symbols-outlined" style={{ fontSize: 16, color: '#747783' }}>language</span>}
          />
        </Form.Item>

        {/* Lĩnh vực */}
        <Form.Item
          name="industry"
          label="Lĩnh vực hoạt động"
          rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
        >
          <Select size="large" placeholder="Chọn lĩnh vực">
            {INDUSTRY_OPTIONS.map((i) => (
              <Option key={i} value={i}>
                {i}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Lĩnh vực khác */}
        {showCustomIndustry && (
          <Form.Item
            name="customIndustry"
            label="Nhập lĩnh vực khác"
            className="cr-form-grid--full"
            rules={[{ required: true, message: 'Vui lòng nhập lĩnh vực khác' }]}
          >
            <Input size="large" placeholder="Ví dụ: Nông nghiệp công nghệ cao, Nghệ thuật..." />
          </Form.Item>
        )}

        {/* Quy mô */}
        <Form.Item name="companySize" label="Quy mô nhân sự">
          <Select size="large" placeholder="Chọn quy mô">
            {COMPANY_SIZE_OPTIONS.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Mã số thuế */}
        <Form.Item name="taxCode" label="Mã số thuế doanh nghiệp">
          <Input size="large" placeholder="0123456789" />
        </Form.Item>

        {/* Email liên hệ */}
        <Form.Item name="contactEmail" label="Email liên hệ tuyển dụng">
          <Input size="large" placeholder="hr@congty.vn" type="email" />
        </Form.Item>

        {/* Địa chỉ */}
        <Form.Item name="address" label="Địa chỉ trụ sở" className="cr-form-grid--full">
          <Input size="large" placeholder="Số 1 Đào Duy Anh, Quận Đống Đa, Hà Nội" />
        </Form.Item>

        {/* Giới thiệu công ty */}
        <Form.Item name="description" label="Giới thiệu công ty" className="cr-form-grid--full">
          <ReactQuill
            theme="snow"
            value={desc}
            onChange={(val) => {
              setDesc(val);
              form.setFieldValue('description', val === '<p><br></p>' ? '' : val);
            }}
            placeholder="Mô tả về lĩnh vực, sứ mệnh và văn hoá doanh nghiệp..."
            style={{ minHeight: 160 }}
          />
        </Form.Item>
      </div>
    </div>
  );
}
