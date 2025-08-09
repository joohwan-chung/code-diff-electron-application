const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// 개발 모드인지 확인하는 함수
function isDevelopment() {
  return process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDevelopment() // 개발 모드에서만 개발자 도구 활성화
    },
    // icon: path.join(__dirname, 'icon.png'), // 아이콘 파일이 없을 때는 주석 처리
    titleBarStyle: 'default',
    show: false
  });

  // 개발 모드에서는 localhost:3000을 로드, 프로덕션에서는 build/index.html을 로드
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 개발 모드에서만 개발자 도구 열기
  if (isDevelopment()) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 오류 처리
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Renderer process crashed:', event);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

// 커스텀 메뉴 생성
app.on('ready', () => {
  createWindow();
  
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '파일 A 열기',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('open-file-a');
          }
        },
        {
          label: '파일 B 열기',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('open-file-b');
          }
        },
        { type: 'separator' },
        {
          label: '차이점 저장',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-diff');
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '설정',
      submenu: [
        {
          label: '테마',
          submenu: [
            {
              label: '라이트',
              type: 'radio',
              checked: true,
              click: () => {
                mainWindow.webContents.send('change-theme', 'light');
              }
            },
            {
              label: '다크',
              type: 'radio',
              click: () => {
                mainWindow.webContents.send('change-theme', 'dark');
              }
            }
          ]
        },
        {
          label: '비교 모드',
          submenu: [
            {
              label: '라인',
              type: 'radio',
              checked: true,
              click: () => {
                mainWindow.webContents.send('change-diff-mode', 'line');
              }
            },
            {
              label: '단어',
              type: 'radio',
              click: () => {
                mainWindow.webContents.send('change-diff-mode', 'word');
              }
            },
            {
              label: '문자',
              type: 'radio',
              click: () => {
                mainWindow.webContents.send('change-diff-mode', 'char');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '줄 번호 표시',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => {
            mainWindow.webContents.send('toggle-line-numbers', menuItem.checked);
          }
        },
        {
          label: '구문 강조',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => {
            mainWindow.webContents.send('toggle-syntax-highlighting', menuItem.checked);
          }
        }
      ]
    }
  ];

  // 개발 모드에서만 개발자 도구 메뉴 추가
  if (isDevelopment()) {
    template.push({
      label: '보기',
      submenu: [
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 파일 열기 다이얼로그
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'vue'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf8');
      return { filePath, content };
    } catch (error) {
      throw new Error(`파일을 읽을 수 없습니다: ${error.message}`);
    }
  }
  return null;
});

// 파일 저장 다이얼로그
ipcMain.handle('save-file-dialog', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      throw new Error(`파일을 저장할 수 없습니다: ${error.message}`);
    }
  }
  return { success: false };
});

// 설정 저장
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    throw new Error(`설정을 저장할 수 없습니다: ${error.message}`);
  }
});

// 설정 로드
ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settings);
    }
    return {
      theme: 'light',
      diffMode: 'line',
      showLineNumbers: true,
      syntaxHighlighting: true
    };
  } catch (error) {
    console.error('설정 로드 실패:', error);
    return {
      theme: 'light',
      diffMode: 'line',
      showLineNumbers: true,
      syntaxHighlighting: true
    };
  }
});
