import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { diffLines, diffWords, diffChars } from 'diff';

const ViewerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Toolbar = styled.div`
  padding: 1rem;
  background-color: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: ${props => props.theme.primary}dd;
  }

  &:disabled {
    background-color: ${props => props.theme.border};
    cursor: not-allowed;
  }
`;

const DiffContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
`;

const FilePanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.theme.border};
  min-width: 0;
  
  &:last-child {
    border-right: none;
  }
`;

const FileHeader = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.theme.text};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FileName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
`;

const FilePath = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  font-weight: normal;
  word-break: break-all;
`;

const CodeContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  scroll-behavior: auto;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.surface};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.textSecondary};
  }
`;



const LineNumber = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  background-color: ${props => props.theme.surface};
  border-right: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.textSecondary};
  font-size: 0.8rem;
  text-align: right;
  padding-right: 8px;
  user-select: none;
  z-index: 1;
`;

const CodeContent = styled.div`
  margin-left: 50px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre;
  padding: 8px;
  overflow-x: auto;
  word-break: break-all;
`;

const DiffLine = styled.div`
  padding: 2px 8px;
  border-radius: 2px;
  margin: 1px 0;
  
  &.added {
    background-color: ${props => props.theme.success}20;
    color: ${props => props.theme.success};
  }
  
  &.removed {
    background-color: ${props => props.theme.danger}20;
    color: ${props => props.theme.danger};
    text-decoration: line-through;
  }
  
  &.unchanged {
    color: ${props => props.theme.text};
  }
`;

const Stats = styled.div`
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.surface};
  border-top: 1px solid ${props => props.theme.border};
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
  display: flex;
  gap: 2rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatBadge = styled.span`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  
  &.added {
    background-color: ${props => props.theme.success};
    color: white;
  }
  
  &.removed {
    background-color: ${props => props.theme.danger};
    color: white;
  }
  
  &.modified {
    background-color: ${props => props.theme.warning};
    color: black;
  }
`;

function DiffViewer({ fileA, fileB, settings, onReset }) {
  const [diffResult, setDiffResult] = useState(null);
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0 });
  const [language, setLanguage] = useState('javascript');
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  // 스크롤 동기화 중인지 여부 (state 대신 ref 사용으로 렌더링 억제)
  const isSyncingRef = useRef(false);
  const rafIdRef = useRef(null);


  // 파일 확장자로부터 언어 추정
  const getLanguageFromFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'txt': 'text',
      'vue': 'html'
    };
    return languageMap[ext] || 'text';
  };

  useEffect(() => {
    if (fileA && fileB) {
      const langA = getLanguageFromFile(fileA.name);
      const langB = getLanguageFromFile(fileB.name);
      setLanguage(langA === langB ? langA : 'text');

      generateDiff();
    }
  }, [fileA, fileB, settings.diffMode]);

  // 컴포넌트 언마운트 시 RAF 정리
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);



  // 동기 스크롤 처리 (수직/수평 동기화, ref 기반 락)
  const handleScroll = useCallback((sourceRef, targetRef) => {
    if (isSyncingRef.current) return;
    const source = sourceRef.current;
    const target = targetRef.current;

    if (!source || !target) return;

    // 기존 RAF가 있다면 취소하고 최신 프레임에 맞춰 동기화
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    isSyncingRef.current = true;
    rafIdRef.current = requestAnimationFrame(() => {
      // 수직 동기화
      const sourceScrollableHeight = Math.max(0, source.scrollHeight - source.clientHeight);
      const targetScrollableHeight = Math.max(0, target.scrollHeight - target.clientHeight);
      if (sourceScrollableHeight > 0 && targetScrollableHeight > 0) {
        const verticalRatio = source.scrollTop / sourceScrollableHeight;
        const nextTop = verticalRatio * targetScrollableHeight;
        if (Math.abs(target.scrollTop - nextTop) > 0.5) {
          target.scrollTop = nextTop;
        }
      }

      // 수평 동기화
      const sourceScrollableWidth = Math.max(0, source.scrollWidth - source.clientWidth);
      const targetScrollableWidth = Math.max(0, target.scrollWidth - target.clientWidth);
      if (sourceScrollableWidth > 0 && targetScrollableWidth > 0) {
        const horizontalRatio = source.scrollLeft / sourceScrollableWidth;
        const nextLeft = horizontalRatio * targetScrollableWidth;
        if (Math.abs(target.scrollLeft - nextLeft) > 0.5) {
          target.scrollLeft = nextLeft;
        }
      }

      // 다음 이벤트에서 반대편 onScroll이 동작해도 무시되도록 한 틱 뒤 해제
      rafIdRef.current = requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    });
  }, []);

  // 스크롤 이벤트 (좌/우)
  const handleLeftScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    handleScroll(leftContainerRef, rightContainerRef);
  }, [handleScroll]);

  const handleRightScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    handleScroll(rightContainerRef, leftContainerRef);
  }, [handleScroll]);

  const generateDiff = () => {
    if (!fileA || !fileB) return;

    const contentA = fileA.content;
    const contentB = fileB.content;

    let diff;
    let newStats = { added: 0, removed: 0, modified: 0 };

    switch (settings.diffMode) {
      case 'line':
        diff = diffLines(contentA, contentB, {
          ignoreCase: false,
          ignoreWhitespace: false,
          newlineIsToken: true
        });
        break;
      case 'word':
        diff = diffWords(contentA, contentB, {
          ignoreCase: false,
          ignoreWhitespace: false
        });
        break;
      case 'char':
        diff = diffChars(contentA, contentB, {
          ignoreCase: false,
          ignoreWhitespace: false
        });
        break;
      default:
        diff = diffLines(contentA, contentB, {
          ignoreCase: false,
          ignoreWhitespace: false,
          newlineIsToken: true
        });
    }

    // 통계 계산
    diff.forEach(part => {
      if (part.added) {
        newStats.added += part.value.split('\n').length - 1;
      }
      if (part.removed) {
        newStats.removed += part.value.split('\n').length - 1;
      }
      if (!part.added && !part.removed) {
        newStats.modified += part.value.split('\n').length - 1;
      }
    });

    setDiffResult(diff);
    setStats(newStats);
  };

  const saveDiffResult = async () => {
    if (!diffResult || !fileA || !fileB) return;

    try {
      // 구조화된 diff 결과 생성
      const timestamp = new Date().toISOString();
      const diffSummary = {
        metadata: {
          timestamp: timestamp,
          fileA: {
            name: fileA.name,
            path: fileA.path,
            size: fileA.size
          },
          fileB: {
            name: fileB.name,
            path: fileB.path,
            size: fileB.size
          },
          diffMode: settings.diffMode,
          language: language,
          stats: stats
        },
        summary: {
          added: stats.added,
          removed: stats.removed,
          modified: stats.modified,
          totalChanges: stats.added + stats.removed + stats.modified
        },
        changes: diffResult.map(part => ({
          type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
          value: part.value,
          lines: part.value.split('\n').length - 1
        }))
      };

      // 마크다운 형태로 저장
      const markdownContent = `# 코드 비교 결과

## 파일 정보
- **파일 A**: ${fileA.name} (${fileA.path})
- **파일 B**: ${fileB.name} (${fileB.path})
- **비교 시간**: ${new Date(timestamp).toLocaleString('ko-KR')}
- **비교 모드**: ${settings.diffMode === 'line' ? '라인' : settings.diffMode === 'word' ? '단어' : '문자'}
- **언어**: ${language}

## 변경 통계
- ✅ 추가됨: ${stats.added}개
- ❌ 삭제됨: ${stats.removed}개
- 🔄 수정됨: ${stats.modified}개
- 📊 총 변경사항: ${stats.added + stats.removed + stats.modified}개

## 상세 변경사항

\`\`\`diff
${diffResult.map(part => {
  if (part.added) return `+ ${part.value}`;
  if (part.removed) return `- ${part.value}`;
  return `  ${part.value}`;
}).join('')}
\`\`\`

## JSON 데이터
\`\`\`json
${JSON.stringify(diffSummary, null, 2)}
\`\`\`
`;

      const result = await window.electronAPI.saveFileDialog(markdownContent);
      if (result.success) {
        alert('차이점이 성공적으로 저장되었습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다: ' + error.message);
    }
  };

  const renderDiffContent = (side) => {
    if (!diffResult) return null;

    return diffResult.map((part, index) => {
      let className = 'unchanged';
      
      if (side === 'left') {
        // 왼쪽 패널: 삭제된 부분과 변경되지 않은 부분만 표시
        if (part.removed) {
          className = 'removed';
        } else if (!part.added) {
          className = 'unchanged';
        } else {
          // 추가된 부분은 왼쪽에서 숨김
          return null;
        }
      } else {
        // 오른쪽 패널: 추가된 부분과 변경되지 않은 부분만 표시
        if (part.added) {
          className = 'added';
        } else if (!part.removed) {
          className = 'unchanged';
        } else {
          // 삭제된 부분은 오른쪽에서 숨김
          return null;
        }
      }

      if (settings.syntaxHighlighting && language !== 'text') {
        return (
          <DiffLine key={index} className={className}>
            <SyntaxHighlighter
              language={language}
              style={tomorrow}
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              {part.value}
            </SyntaxHighlighter>
          </DiffLine>
        );
      }

      return (
        <DiffLine key={index} className={className}>
          {part.value}
        </DiffLine>
      );
    });
  };

  const renderLineNumbers = (side) => {
    if (!diffResult) return null;

    let lineNumber = 1;
    const numbers = [];

    diffResult.forEach((part, index) => {
      if (side === 'left') {
        // 왼쪽 패널: 삭제된 부분과 변경되지 않은 부분만
        if (part.removed || (!part.added && !part.removed)) {
          const lines = part.value.split('\n').length - 1;
          for (let i = 0; i < lines; i++) {
            numbers.push(lineNumber++);
          }
        }
      } else {
        // 오른쪽 패널: 추가된 부분과 변경되지 않은 부분만
        if (part.added || (!part.added && !part.removed)) {
          const lines = part.value.split('\n').length - 1;
          for (let i = 0; i < lines; i++) {
            numbers.push(lineNumber++);
          }
        }
      }
    });

    return (
      <LineNumber>
        {numbers.map((num, index) => (
          <div key={index} style={{ height: '21px', lineHeight: '21px' }}>
            {num}
          </div>
        ))}
      </LineNumber>
    );
  };



  if (!fileA || !fileB) {
    return (
      <ViewerContainer>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          두 파일을 모두 업로드하면 비교가 시작됩니다.
        </div>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer>
      <Toolbar>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label>비교 모드: </label>
            <Select
              value={settings.diffMode}
              onChange={(e) => settings.onDiffModeChange(e.target.value)}
            >
              <option value="line">라인</option>
              <option value="word">단어</option>
              <option value="char">문자</option>
            </Select>
          </div>
          <Button onClick={saveDiffResult}>
            차이점 저장
          </Button>
          <Button 
            onClick={onReset}
            style={{ 
              backgroundColor: settings.theme.danger,
              marginLeft: 'auto'
            }}
          >
            새로 시작
          </Button>
        </div>
      </Toolbar>

      <DiffContainer>
        <FilePanel>
          <FileHeader>
            <FileName>{fileA.name} (원본)</FileName>
            <FilePath>{fileA.path}</FilePath>
          </FileHeader>
                     <CodeContainer 
             ref={leftContainerRef}
             onScroll={handleLeftScroll}
           >
             {settings.showLineNumbers && renderLineNumbers('left')}
             <CodeContent>
               {renderDiffContent('left')}
             </CodeContent>
           </CodeContainer>
        </FilePanel>

        <FilePanel>
          <FileHeader>
            <FileName>{fileB.name} (수정됨)</FileName>
            <FilePath>{fileB.path}</FilePath>
          </FileHeader>
                     <CodeContainer 
             ref={rightContainerRef}
             onScroll={handleRightScroll}
           >
             {settings.showLineNumbers && renderLineNumbers('right')}
             <CodeContent>
               {renderDiffContent('right')}
             </CodeContent>
           </CodeContainer>
        </FilePanel>
      </DiffContainer>

      <Stats>
        <StatItem>
          추가됨: <StatBadge className="added">{stats.added}</StatBadge>
        </StatItem>
        <StatItem>
          삭제됨: <StatBadge className="removed">{stats.removed}</StatBadge>
        </StatItem>
        <StatItem>
          수정됨: <StatBadge className="modified">{stats.modified}</StatBadge>
        </StatItem>
        <StatItem>
          언어: {language}
        </StatItem>
      </Stats>
    </ViewerContainer>
  );
}

export default DiffViewer;
