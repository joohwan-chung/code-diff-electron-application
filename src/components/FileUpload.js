import React from 'react';
import styled from 'styled-components';

const UploadContainer = styled.div`
  padding: 2rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  min-height: 400px;
`;

const FileUploadArea = styled.div`
  flex: 1;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const UploadBox = styled.div`
  border: 2px dashed ${props => props.theme.border};
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  background-color: ${props => props.theme.surface};
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: ${props => props.theme.primary};
    background-color: ${props => props.theme.primary}10;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 0.9rem;
`;

const FileName = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  word-break: break-all;
`;

const FilePath = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
`;

const FileSize = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 0.8rem;
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.primary}dd;
  }

  &:disabled {
    background-color: ${props => props.theme.border};
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  background-color: ${props => props.theme.danger};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;

  &:hover {
    background-color: ${props => props.theme.danger}dd;
  }
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.text};
`;

function FileUpload({ files, onFileUpload, theme }) {
  const openFileDialog = async (fileType) => {
    try {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        onFileUpload(fileType, {
          name: result.filePath.split(/[/\\]/).pop(),
          size: result.content.length,
          content: result.content,
          path: result.filePath
        });
      }
    } catch (error) {
      console.error('파일 열기 실패:', error);
      alert('파일을 열 수 없습니다: ' + error.message);
    }
  };

  const clearFile = (fileType) => {
    onFileUpload(fileType, null);
  };

  return (
    <UploadContainer>
      <FileUploadArea>
        <Title>파일 A</Title>
        <UploadBox theme={theme}>
          <div>
            <p>파일을 선택하세요</p>
            <Button onClick={() => openFileDialog('fileA')}>
              파일 선택
            </Button>
          </div>
        </UploadBox>

        {files.fileA && (
          <FileInfo>
            <FileName>{files.fileA.name}</FileName>
            <FilePath>{files.fileA.path}</FilePath>
            <FileSize>{(files.fileA.size / 1024).toFixed(2)} KB</FileSize>
            <ClearButton onClick={() => clearFile('fileA')}>
              제거
            </ClearButton>
          </FileInfo>
        )}
      </FileUploadArea>

      <FileUploadArea>
        <Title>파일 B</Title>
        <UploadBox theme={theme}>
          <div>
            <p>파일을 선택하세요</p>
            <Button onClick={() => openFileDialog('fileB')}>
              파일 선택
            </Button>
          </div>
        </UploadBox>

        {files.fileB && (
          <FileInfo>
            <FileName>{files.fileB.name}</FileName>
            <FilePath>{files.fileB.path}</FilePath>
            <FileSize>{(files.fileB.size / 1024).toFixed(2)} KB</FileSize>
            <ClearButton onClick={() => clearFile('fileB')}>
              제거
            </ClearButton>
          </FileInfo>
        )}
      </FileUploadArea>
    </UploadContainer>
  );
}

export default FileUpload;
