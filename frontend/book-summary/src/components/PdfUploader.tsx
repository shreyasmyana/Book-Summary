import React, { useState } from 'react';
import { Upload, Button, message,Spin, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const PdfUploader: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([]); // Type any[] for fileList
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>(''); // Type string for summary

  const handleUploadChange = (info: { fileList: any[] }) => {
    setFileList(info.fileList);
  };

  const handleSummarize = async () => {
    if (fileList.length === 0) {
      message.error('Please upload a PDF file first!');
      return;
    }
    setLoading(true); 
    const formData = new FormData();
    formData.append('pdfFile', fileList[0].originFileObj as File); // Explicitly cast to File

    try {
      const response:any = await axios.post('http://localhost:8000/book-summary', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSummary(response.data.summary);
    } catch (error) {
      message.error('Failed to summarize the PDF. Please try again.');
    }finally {
        setLoading(false); // Reset loading state
      }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>PDF Summarizer</Title>
      <Upload
        fileList={fileList}
        onChange={handleUploadChange}
        beforeUpload={() => false} // Prevent automatic upload
        accept=".pdf"
        showUploadList={true}
      >
        <Button icon={<UploadOutlined />}>Upload PDF</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleSummarize}
        style={{ marginTop: '20px' }}
      >
        Summarize
      </Button>
      {loading && (
        <div style={{ marginTop: 20 }}>
          <Spin size="large" />
        </div>
      )}
      {summary && (
        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Summary:</Title>
          <Text>{summary}</Text>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
