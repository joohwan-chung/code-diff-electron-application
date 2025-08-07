import React from 'react';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.text};
  font-size: 1.2rem;
`;

const SettingItem = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
`;

const SettingLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  cursor: pointer;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  margin-left: auto;
`;

const Checkbox = styled.input`
  margin-left: auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &.primary {
    background-color: ${props => props.theme.primary};
    color: white;

    &:hover {
      background-color: ${props => props.theme.primary}dd;
    }
  }

  &.secondary {
    background-color: ${props => props.theme.surface};
    color: ${props => props.theme.text};
    border: 1px solid ${props => props.theme.border};

    &:hover {
      background-color: ${props => props.theme.border};
    }
  }
`;

const Description = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
`;

function Settings({ settings, onSettingsChange, onClose }) {
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  return (
    <SettingsContainer>
      <SectionTitle>설정</SectionTitle>

      <SettingsSection>
        <SettingItem>
          <SettingLabel>
            테마
            <Select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
            </Select>
          </SettingLabel>
          <Description>
            앱의 전체적인 색상 테마를 선택합니다.
          </Description>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            비교 모드
            <Select
              value={settings.diffMode}
              onChange={(e) => handleSettingChange('diffMode', e.target.value)}
            >
              <option value="line">라인 단위</option>
              <option value="word">단어 단위</option>
              <option value="char">문자 단위</option>
            </Select>
          </SettingLabel>
          <Description>
            코드 비교 시 사용할 단위를 선택합니다. 라인 단위가 가장 일반적입니다.
          </Description>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            줄 번호 표시
            <Checkbox
              type="checkbox"
              checked={settings.showLineNumbers}
              onChange={(e) => handleSettingChange('showLineNumbers', e.target.checked)}
            />
          </SettingLabel>
          <Description>
            코드 편집기에서 줄 번호를 표시할지 여부를 설정합니다.
          </Description>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            구문 강조
            <Checkbox
              type="checkbox"
              checked={settings.syntaxHighlighting}
              onChange={(e) => handleSettingChange('syntaxHighlighting', e.target.checked)}
            />
          </SettingLabel>
          <Description>
            코드의 구문을 색상으로 강조 표시할지 여부를 설정합니다.
          </Description>
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>정보</SectionTitle>
        <SettingItem>
          <Description>
            <strong>버전:</strong> 1.0.0<br />
            <strong>개발자:</strong> 코드 비교 앱 팀<br />
            <strong>라이선스:</strong> MIT<br />
            <strong>기술 스택:</strong> Electron + React + diff.js
          </Description>
        </SettingItem>
      </SettingsSection>

      <ButtonGroup>
        <Button className="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button className="primary" onClick={onClose}>
          저장
        </Button>
      </ButtonGroup>
    </SettingsContainer>
  );
}

export default Settings;
