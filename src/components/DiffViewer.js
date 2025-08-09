import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { diffLines, diffWords, diffChars, structuredPatch } from 'diff';

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
  min-height: 0;
  
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

  .inline-add {
    background-color: ${props => props.theme.success}40;
    text-decoration: none;
    color: inherit;
  }

  .inline-del {
    background-color: ${props => props.theme.danger}40;
    text-decoration: none;
    color: inherit;
  }

  &.selected {
    outline: 1px solid ${props => props.theme.primary};
    background-image: linear-gradient(0deg, ${props => props.theme.primary}10, ${props => props.theme.primary}10);
  }

  &.empty {
    visibility: hidden;
    height: 21px;
  }
`;

// GitHub Desktop 스타일의 Unified 테이블 레이아웃
const UnifiedRow = styled.div`
  display: grid;
  grid-template-columns: 28px 64px 64px 1fr;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  align-items: stretch;
`;

const MarkerCell = styled.div`
  text-align: center;
  color: ${props => props.theme.textSecondary};
  user-select: none;
  padding: 0 4px;
`;

const LineNoCell = styled.div`
  text-align: right;
  color: ${props => props.theme.textSecondary};
  user-select: none;
  padding: 0 8px;
  border-right: 1px solid ${props => props.theme.border};
`;

const UnifiedCodeCell = styled.div`
  padding: 2px 8px;
  white-space: pre-wrap;
  word-break: break-word;
  &.added { background-color: ${props => props.theme.success}20; color: ${props => props.theme.success}; }
  &.removed { background-color: ${props => props.theme.danger}20; color: ${props => props.theme.danger}; }
  &.selected { outline: 1px solid ${props => props.theme.primary}; background-image: linear-gradient(0deg, ${props => props.theme.primary}10, ${props => props.theme.primary}10); }
`;

const ContextMenu = styled.div`
  position: fixed;
  z-index: 1000;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  padding: 4px 0;
  min-width: 160px;
`;

const ContextItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  color: ${props => props.theme.text};
  &:hover { background: ${props => props.theme.border}; }
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
  const [contextSize, setContextSize] = useState(3);
  const [splitRows, setSplitRows] = useState({ left: [], right: [] });
  const [selected, setSelected] = useState(new Set());
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, key: null, text: '' });
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [dragging, setDragging] = useState({ active: false, side: null, anchorIndex: -1 });
  const unifiedOrderRef = useRef([]);
  const unifiedTextsRef = useRef({});
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
  }, [fileA, fileB, settings.diffMode, settings.viewMode, contextSize]);

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

  const buildStructuredPatch = () => {
    if (!fileA || !fileB) return null;
    return structuredPatch(
      fileA.name,
      fileB.name,
      fileA.content,
      fileB.content,
      'original',
      'modified',
      { context: contextSize, ignoreWhitespace, ignoreCase }
    );
  };

  // Split 모드 정렬 및 인라인 하이라이트 준비
  const buildSplitRows = useCallback(() => {
    const patch = buildStructuredPatch();
    if (!patch) { setSplitRows({ left: [], right: [] }); return; }
    const left = [];
    const right = [];
    patch.hunks.forEach((hunk) => {
      let oldLine = hunk.oldStart;
      let newLine = hunk.newStart;
      for (let i = 0; i < hunk.lines.length; i++) {
        const line = hunk.lines[i];
        const sign = line[0];
        const value = line.slice(1);

        const makeInlineNodes = (a, b) => {
          const parts = diffWords(a, b, { ignoreCase: false, ignoreWhitespace: false });
          const oldNodes = [];
          const newNodes = [];
          parts.forEach((p, idx) => {
            if (p.added) newNodes.push(<span key={`a-${idx}`} className="inline-add">{p.value}</span>);
            else if (p.removed) oldNodes.push(<span key={`r-${idx}`} className="inline-del">{p.value}</span>);
            else { oldNodes.push(<span key={`c-o-${idx}`}>{p.value}</span>); newNodes.push(<span key={`c-n-${idx}`}>{p.value}</span>); }
          });
          return { oldNode: <>{oldNodes}</>, newNode: <>{newNodes}</> };
        };

        if (sign === ' ') {
          if (showOnlyChanges) { oldLine += 1; newLine += 1; continue; }
          left.push({ key: `c-${oldLine}-${newLine}-l`, className: 'unchanged', text: value + '\n', lineNo: oldLine });
          right.push({ key: `c-${oldLine}-${newLine}-r`, className: 'unchanged', text: value + '\n', lineNo: newLine });
          oldLine += 1; newLine += 1;
        } else if (sign === '-') {
          // Pair with next '+' if any
          if (i + 1 < hunk.lines.length && hunk.lines[i + 1][0] === '+') {
            const nextVal = hunk.lines[i + 1].slice(1);
            const { oldNode, newNode } = makeInlineNodes(value, nextVal);
            left.push({ key: `rm-${oldLine}-l`, className: 'removed', node: oldNode, text: value + '\n', lineNo: oldLine });
            right.push({ key: `emp-${oldLine}-r`, className: 'empty', text: '' });
            oldLine += 1;

            left.push({ key: `emp-${newLine}-l`, className: 'empty', text: '' });
            right.push({ key: `ad-${newLine}-r`, className: 'added', node: newNode, text: nextVal + '\n', lineNo: newLine });
            newLine += 1;
            i += 1; // consume next
          } else {
            left.push({ key: `rm-${oldLine}-l`, className: 'removed', text: value + '\n', lineNo: oldLine });
            right.push({ key: `emp-${oldLine}-r`, className: 'empty', text: '' });
            oldLine += 1;
          }
        } else if (sign === '+') {
          left.push({ key: `emp-${newLine}-l`, className: 'empty', text: '' });
          right.push({ key: `ad-${newLine}-r`, className: 'added', text: value + '\n', lineNo: newLine });
          newLine += 1;
        }
      }
    });
    setSplitRows({ left, right });
  }, [fileA, fileB, contextSize, settings.diffMode, showOnlyChanges, ignoreWhitespace, ignoreCase]);

  useEffect(() => {
    if (settings.viewMode === 'split') {
      buildSplitRows();
    }
  }, [buildSplitRows, settings.viewMode]);

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

  const renderUnified = () => {
    const patch = buildStructuredPatch();
    if (!patch) return null;
    const rows = [];
    const order = [];
    const texts = {};

    const renderInlineParts = (oldText, newText) => {
      const parts = diffWords(oldText, newText, { ignoreCase: false, ignoreWhitespace: false });
      const oldNodes = [];
      const newNodes = [];
      parts.forEach((p, idx) => {
        if (p.added) {
          newNodes.push(<span key={`a-${idx}`} className="inline-add">{p.value}</span>);
        } else if (p.removed) {
          oldNodes.push(<span key={`r-${idx}`} className="inline-del">{p.value}</span>);
        } else {
          oldNodes.push(<span key={`c-o-${idx}`}>{p.value}</span>);
          newNodes.push(<span key={`c-n-${idx}`}>{p.value}</span>);
        }
      });
      return { oldNode: <>{oldNodes}</>, newNode: <>{newNodes}</> };
    };

    patch.hunks.forEach((hunk, hunkIdx) => {
      let oldLine = hunk.oldStart;
      let newLine = hunk.newStart;

      rows.push(
        <UnifiedRow key={`hunk-${hunkIdx}-hdr`}>
          <MarkerCell>…</MarkerCell>
          <LineNoCell></LineNoCell>
          <LineNoCell></LineNoCell>
          <UnifiedCodeCell>
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </UnifiedCodeCell>
        </UnifiedRow>
      );

      for (let i = 0; i < hunk.lines.length; i++) {
        const l = hunk.lines[i];
        const sign = l[0];
        const value = l.slice(1);
        if (showOnlyChanges && sign === ' ') { oldLine += 1; newLine += 1; continue; }

        // 대체(removed->added) 한 쌍 인라인 하이라이트
        if (sign === '-' && i + 1 < hunk.lines.length && hunk.lines[i + 1][0] === '+') {
          const next = hunk.lines[i + 1].slice(1);
          const { oldNode, newNode } = renderInlineParts(value, next);

          const keyR = `unified-${hunkIdx}-${i}-r`;
          order.push(keyR); texts[keyR] = value + '\n';
          rows.push(
            <UnifiedRow key={keyR}>
              <MarkerCell>-</MarkerCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(value + '\n')}>{oldLine}</LineNoCell>
              <LineNoCell></LineNoCell>
              <UnifiedCodeCell
                className={`removed ${selected.has(keyR) ? 'selected' : ''}`}
                onMouseDown={() => startDrag('unified', order.length - 1)}
                onMouseEnter={() => dragging.active && dragging.side === 'unified' && updateDrag(order.length - 1)}
                onClick={() => toggleSelect(keyR, value)}
                onContextMenu={(e) => openMenu(e, keyR, value)}
              >
                {oldNode}
              </UnifiedCodeCell>
            </UnifiedRow>
          );
          const keyA = `unified-${hunkIdx}-${i+1}-a`;
          order.push(keyA); texts[keyA] = next + '\n';
          rows.push(
            <UnifiedRow key={keyA}>
              <MarkerCell>+</MarkerCell>
              <LineNoCell></LineNoCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(next + '\n')}>{newLine}</LineNoCell>
              <UnifiedCodeCell
                className={`added ${selected.has(keyA) ? 'selected' : ''}`}
                onMouseDown={() => startDrag('unified', order.length - 1)}
                onMouseEnter={() => dragging.active && dragging.side === 'unified' && updateDrag(order.length - 1)}
                onClick={() => toggleSelect(keyA, next)}
                onContextMenu={(e) => openMenu(e, keyA, next)}
              >
                {newNode}
              </UnifiedCodeCell>
            </UnifiedRow>
          );

          oldLine += 1;
          newLine += 1;
          i += 1; // consume next
          continue;
        }

        if (sign === ' ') {
          const keyC = `unified-${hunkIdx}-${i}-c`;
          order.push(keyC); texts[keyC] = value + '\n';
          rows.push(
            <UnifiedRow key={keyC}>
              <MarkerCell>&nbsp;</MarkerCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(value + '\n')}>{oldLine}</LineNoCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(value + '\n')}>{newLine}</LineNoCell>
              <UnifiedCodeCell
                className={selected.has(keyC) ? 'selected' : ''}
                onMouseDown={() => startDrag('unified', order.length - 1)}
                onMouseEnter={() => dragging.active && dragging.side === 'unified' && updateDrag(order.length - 1)}
                onClick={() => toggleSelect(keyC, value)}
                onContextMenu={(e) => openMenu(e, keyC, value)}
              >
                {settings.syntaxHighlighting && language !== 'text' ? (
                  <SyntaxHighlighter
                    language={language}
                    style={tomorrow}
                    customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '14px', lineHeight: '1.5' }}
                  >
                    {value + '\n'}
                  </SyntaxHighlighter>
                ) : (
                  value
                )}
              </UnifiedCodeCell>
            </UnifiedRow>
          );
          oldLine += 1;
          newLine += 1;
        } else if (sign === '-') {
          const keyRm = `unified-${hunkIdx}-${i}-rm`;
          order.push(keyRm); texts[keyRm] = value + '\n';
          rows.push(
            <UnifiedRow key={keyRm}>
              <MarkerCell>-</MarkerCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(value + '\n')}>{oldLine}</LineNoCell>
              <LineNoCell></LineNoCell>
              <UnifiedCodeCell
                className={`removed ${selected.has(keyRm) ? 'selected' : ''}`}
                onMouseDown={() => startDrag('unified', order.length - 1)}
                onMouseEnter={() => dragging.active && dragging.side === 'unified' && updateDrag(order.length - 1)}
                onClick={() => toggleSelect(keyRm, value)}
                onContextMenu={(e) => openMenu(e, keyRm, value)}
              >
                {value}
              </UnifiedCodeCell>
            </UnifiedRow>
          );
          oldLine += 1;
        } else if (sign === '+') {
          const keyAd = `unified-${hunkIdx}-${i}-ad`;
          order.push(keyAd); texts[keyAd] = value + '\n';
          rows.push(
            <UnifiedRow key={keyAd}>
              <MarkerCell>+</MarkerCell>
              <LineNoCell></LineNoCell>
              <LineNoCell onClick={() => navigator.clipboard.writeText(value + '\n')}>{newLine}</LineNoCell>
              <UnifiedCodeCell
                className={`added ${selected.has(keyAd) ? 'selected' : ''}`}
                onMouseDown={() => startDrag('unified', order.length - 1)}
                onMouseEnter={() => dragging.active && dragging.side === 'unified' && updateDrag(order.length - 1)}
                onClick={() => toggleSelect(keyAd, value)}
                onContextMenu={(e) => openMenu(e, keyAd, value)}
              >
                {value}
              </UnifiedCodeCell>
            </UnifiedRow>
          );
          newLine += 1;
        }
      }
    });
    unifiedOrderRef.current = order;
    unifiedTextsRef.current = texts;
    return <>{rows}</>;
  };

  const renderSplitSide = (side) => {
    const rows = side === 'left' ? splitRows.left : splitRows.right;
    if (!rows || rows.length === 0) return null;
    return rows.map((row, idx) => {
      const key = `${side}-${idx}`;
      const className = `${row.className} ${selected.has(key) ? 'selected' : ''}`;
      if (row.className === 'empty') {
        return <DiffLine key={key} className="empty"> </DiffLine>;
      }
      const contentNode = row.node ? row.node : (
        settings.syntaxHighlighting && language !== 'text' ? (
          <SyntaxHighlighter
            language={language}
            style={tomorrow}
            customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '14px', lineHeight: '1.5' }}
          >
            {row.text}
          </SyntaxHighlighter>
        ) : (
          row.text
        )
      );
      return (
        <DiffLine
          key={key}
          className={className}
          onMouseDown={() => startDrag(side, idx)}
          onMouseEnter={() => dragging.active && dragging.side === side && updateDrag(idx)}
          onClick={() => toggleSelect(key, row.text)}
          onContextMenu={(e) => openMenu(e, key, row.text)}
        >
          {contentNode}
        </DiffLine>
      );
    });
  };

  const renderLineNumbers = (side) => {
    if (settings.viewMode === 'split') {
      const rows = side === 'left' ? splitRows.left : splitRows.right;
      if (!rows) return null;
      return (
        <LineNumber>
          {rows.map((row, index) => {
            const text = row.text || '';
            return (
              <div
                key={index}
                style={{ height: '21px', lineHeight: '21px', cursor: text ? 'pointer' : 'default' }}
                onClick={() => text && navigator.clipboard.writeText(text)}
                title={text ? '줄 복사' : ''}
              >
                {row.lineNo || ''}
              </div>
            );
          })}
        </LineNumber>
      );
    }
    // unified에서는 개별 줄번호 컬럼을 자체적으로 렌더링함
    return null;
  };

  const toggleSelect = (key, text) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openMenu = (e, key, text) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, key, text });
  };

  const closeMenu = () => setMenu({ visible: false, x: 0, y: 0, key: null, text: '' });

  const copySelected = async () => {
    try {
      const texts = [];
      if (settings.viewMode === 'split') {
        const collect = (rows, prefix) => rows.map((row, idx) => selected.has(`${prefix}-${idx}`) && row.text ? row.text : '').join('');
        texts.push(collect(splitRows.left, 'left'));
        texts.push(collect(splitRows.right, 'right'));
      } else {
        const keys = unifiedOrderRef.current.filter(k => selected.has(k));
        const content = keys.map(k => unifiedTextsRef.current[k] || '').join('');
        texts.push(content);
      }
      const content = texts.join('');
      if (content.trim().length > 0) {
        await navigator.clipboard.writeText(content);
        alert('선택한 라인을 클립보드에 복사했습니다.');
      }
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const copySide = async (side) => {
    try {
      if (settings.viewMode === 'split') {
        const rows = side === 'left' ? splitRows.left : splitRows.right;
        const content = rows.map(r => r.text || '').join('');
        await navigator.clipboard.writeText(content);
        alert(`${side === 'left' ? '좌측' : '우측'} 전체를 복사했습니다.`);
      }
    } catch (e) { console.error(e); }
  };

  const commentPrefix = useMemo(() => {
    const lang = language;
    if (['python', 'ruby'].includes(lang)) return '# ';
    if (['sql'].includes(lang)) return '-- ';
    return '// ';
  }, [language]);

  const copyCommented = async () => {
    try {
      let content = '';
      if (settings.viewMode === 'split') {
        const collect = (rows, prefix) => rows.map((row, idx) => selected.has(`${prefix}-${idx}`) && row.text ? commentPrefix + row.text : '').join('');
        content = collect(splitRows.left, 'left') + collect(splitRows.right, 'right');
      } else {
        const keys = unifiedOrderRef.current.filter(k => selected.has(k));
        content = keys.map(k => commentPrefix + (unifiedTextsRef.current[k] || '')).join('');
      }
      if (content.trim().length > 0) {
        await navigator.clipboard.writeText(content);
        alert('선택한 라인을 주석 형태로 복사했습니다.');
      }
    } catch (e) { console.error(e); }
  };

  const startDrag = (side, index) => {
    setDragging({ active: true, side, anchorIndex: index });
    updateDrag(index, side, true);
  };

  const updateDrag = (currentIndex, sideParam, initializing = false) => {
    const side = sideParam || dragging.side;
    const anchor = dragging.anchorIndex;
    if (!side || anchor < 0) return;
    const [start, end] = anchor <= currentIndex ? [anchor, currentIndex] : [currentIndex, anchor];
    const next = new Set();
    if (side === 'left' || side === 'right') {
      for (let i = start; i <= end; i++) next.add(`${side}-${i}`);
    } else if (side === 'unified') {
      for (let i = start; i <= end; i++) next.add(unifiedOrderRef.current[i]);
    }
    setSelected(next);
  };

  useEffect(() => {
    const handleUp = () => setDragging({ active: false, side: null, anchorIndex: -1 });
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);



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
          <div>
            <label>뷰 모드: </label>
            <Select
              value={settings.viewMode || 'split'}
              onChange={(e) => settings.onViewModeChange && settings.onViewModeChange(e.target.value)}
            >
              <option value="split">분할</option>
              <option value="unified">단일</option>
            </Select>
          </div>
          <div>
            <label>컨텍스트: </label>
            <Select value={contextSize} onChange={(e) => setContextSize(Number(e.target.value))}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </Select>
          </div>
          <div>
            <label>옵션: </label>
            <label style={{ marginLeft: 8 }}>
              <input type="checkbox" checked={showOnlyChanges} onChange={(e) => setShowOnlyChanges(e.target.checked)} /> 변경만 보기
            </label>
            <label style={{ marginLeft: 8 }}>
              <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} /> 공백 무시
            </label>
            <label style={{ marginLeft: 8 }}>
              <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} /> 대소문자 무시
            </label>
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

      {settings.viewMode === 'unified' ? (
        <DiffContainer>
          <FilePanel style={{ borderRight: 'none' }}>
            <FileHeader>
              <FileName>{fileA.name} → {fileB.name} (Unified)</FileName>
              <FilePath>{fileA.path} → {fileB.path}</FilePath>
            </FileHeader>
            <CodeContainer ref={leftContainerRef} onScroll={handleLeftScroll}>
              <CodeContent>
                {renderUnified()}
              </CodeContent>
            </CodeContainer>
          </FilePanel>
        </DiffContainer>
      ) : (
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
                {renderSplitSide('left')}
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
                {renderSplitSide('right')}
              </CodeContent>
            </CodeContainer>
          </FilePanel>
        </DiffContainer>
      )}

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
        <StatItem>
          컨텍스트: {contextSize}
        </StatItem>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Button onClick={copySelected}>선택 복사</Button>
          <Button onClick={() => copySide('left')}>좌측 전체 복사</Button>
          <Button onClick={() => copySide('right')}>우측 전체 복사</Button>
          <Button onClick={copyCommented}>선택 주석 복사</Button>
          {menu.visible && (
            <ContextMenu style={{ top: menu.y, left: menu.x }} onMouseLeave={closeMenu}>
              <ContextItem onClick={() => { navigator.clipboard.writeText(menu.text || ''); closeMenu(); }}>라인 복사</ContextItem>
              <ContextItem onClick={() => { navigator.clipboard.writeText(commentPrefix + (menu.text || '')); closeMenu(); }}>라인 주석 복사</ContextItem>
              <ContextItem onClick={() => { setSelected(new Set()); closeMenu(); }}>선택 해제</ContextItem>
            </ContextMenu>
          )}
        </div>
      </Stats>
    </ViewerContainer>
  );
}

export default DiffViewer;
