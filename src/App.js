import React, { useState, useEffect, useCallback } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
// Electron API를 window.electronAPI를 통해 사용
import FileUpload from './components/FileUpload';
import DiffViewer from './components/DiffViewer';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
    color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
    transition: all 0.3s ease;
  }
`;

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background-color: ${props => props.theme === 'dark' ? '#2d2d2d' : '#f8f9fa'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#404040' : '#e9ecef'};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const lightTheme = {
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#000000',
  textSecondary: '#6c757d',
  border: '#e9ecef',
  primary: '#007bff',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107'
};

const darkTheme = {
  background: '#1e1e1e',
  surface: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#404040',
  primary: '#007bff',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107'
};

function App() {
  const [files, setFiles] = useState({ fileA: null, fileB: null });
  const [settings, setSettings] = useState({
    theme: 'light',
    diffMode: 'line',
    viewMode: 'split',
    showLineNumbers: true,
    syntaxHighlighting: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 설정 로드
    const loadSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.loadSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('설정 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleFileUpload = (fileType, file) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const handleSettingsChange = useCallback(async (newSettings) => {
    setSettings(newSettings);
    try {
      await window.electronAPI.saveSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }, []);

  const handleDiffModeChange = (diffMode) => {
    const newSettings = { ...settings, diffMode };
    handleSettingsChange(newSettings);
  };

  const handleViewModeChange = (viewMode) => {
    const newSettings = { ...settings, viewMode };
    handleSettingsChange(newSettings);
  };

  // 메뉴 이벤트 핸들러들을 useCallback으로 메모이제이션
  const handleOpenFileA = useCallback(async () => {
    try {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        handleFileUpload('fileA', {
          name: result.filePath.split(/[/\\]/).pop(),
          size: result.content.length,
          content: result.content,
          path: result.filePath
        });
      }
    } catch (error) {
      console.error('파일 A 열기 실패:', error);
    }
  }, []);

  const handleOpenFileB = useCallback(async () => {
    try {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        handleFileUpload('fileB', {
          name: result.filePath.split(/[/\\]/).pop(),
          size: result.content.length,
          content: result.content,
          path: result.filePath
        });
      }
    } catch (error) {
      console.error('파일 B 열기 실패:', error);
    }
  }, []);

  const handleChangeTheme = useCallback((event, theme) => {
    const newSettings = { ...settings, theme };
    handleSettingsChange(newSettings);
  }, [settings, handleSettingsChange]);

  const handleChangeDiffMode = useCallback((event, diffMode) => {
    const newSettings = { ...settings, diffMode };
    handleSettingsChange(newSettings);
  }, [settings, handleSettingsChange]);

  const handleToggleLineNumbers = useCallback((event, checked) => {
    const newSettings = { ...settings, showLineNumbers: checked };
    handleSettingsChange(newSettings);
  }, [settings, handleSettingsChange]);

  const handleToggleSyntaxHighlighting = useCallback((event, checked) => {
    const newSettings = { ...settings, syntaxHighlighting: checked };
    handleSettingsChange(newSettings);
  }, [settings, handleSettingsChange]);

  // 메뉴 이벤트 처리
  useEffect(() => {
    // 이벤트 리스너 등록
    window.electronAPI.onOpenFileA(handleOpenFileA);
    window.electronAPI.onOpenFileB(handleOpenFileB);
    window.electronAPI.onChangeTheme(handleChangeTheme);
    window.electronAPI.onChangeDiffMode(handleChangeDiffMode);
    if (window.electronAPI.onChangeViewMode) {
      window.electronAPI.onChangeViewMode((event, mode) => handleViewModeChange(mode));
    }
    window.electronAPI.onToggleLineNumbers(handleToggleLineNumbers);
    window.electronAPI.onToggleSyntaxHighlighting(handleToggleSyntaxHighlighting);

    return () => {
      // 이벤트 리스너 정리
      window.electronAPI.removeAllListeners('open-file-a');
      window.electronAPI.removeAllListeners('open-file-b');
      window.electronAPI.removeAllListeners('change-theme');
      window.electronAPI.removeAllListeners('change-diff-mode');
      if (window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('change-view-mode');
      }
      window.electronAPI.removeAllListeners('toggle-line-numbers');
      window.electronAPI.removeAllListeners('toggle-syntax-highlighting');
    };
  }, [handleOpenFileA, handleOpenFileB, handleChangeTheme, handleChangeDiffMode, handleToggleLineNumbers, handleToggleSyntaxHighlighting]);

  const currentTheme = settings.theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle theme={settings.theme} />
      <AppContainer>
        <Header theme={settings.theme}>
          <Title>코드 비교 앱</Title>
          <div style={{ fontSize: '0.9rem', color: currentTheme.textSecondary }}>
            Ctrl+1: 파일 A | Ctrl+2: 파일 B | Ctrl+S: 저장
          </div>
        </Header>

        <MainContent>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: currentTheme.text
            }}>
              <div>로딩 중...</div>
            </div>
          ) : (
            <>
              {(!files.fileA || !files.fileB) ? (
                <FileUpload
                  files={files}
                  onFileUpload={handleFileUpload}
                  theme={settings.theme}
                />
              ) : (
                <DiffViewer
                  fileA={files.fileA}
                  fileB={files.fileB}
                  settings={{ ...settings, onDiffModeChange: handleDiffModeChange, onViewModeChange: handleViewModeChange }}
                  onReset={() => setFiles({ fileA: null, fileB: null })}
                />
              )}
            </>
          )}
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
